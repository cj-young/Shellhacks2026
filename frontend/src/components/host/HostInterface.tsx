import type { GameConnection } from "#/lib/use-game-connection";
import type { Ingredient, Recipe } from "#/lib/types";
import { useEffect, useState } from "react";
import ingredients from "../../data/ingredients.json";
import {
  DEMO_STACKS,
  HostRaceStacks,
} from "#/components/chop-chop/screens/HostRaceStacks";
import type { RaceStack } from "#/components/chop-chop/screens/HostRaceStacks";
import { LOBBY_COLORS } from "#/components/chop-chop/screens/HostLobbyNew";
import { TimesUp } from "#/components/chop-chop/screens/TimesUp";
import { RoundLeaderboard } from "#/components/chop-chop/screens/RoundLeaderboard";
import { iconIdFor } from "#/components/client/Store";

const DEFAULT_ROUND_SECONDS = 60;
const TIMES_UP_MS = 3000;
const SHOP_ROTATIONS = [-6, 5, -4, 6];

/** `/host?round=10` shortens rounds for testing. */
function roundSeconds() {
  if (typeof window === "undefined") return DEFAULT_ROUND_SECONDS;
  const fromUrl = Number(
    new URLSearchParams(window.location.search).get("round"),
  );
  return fromUrl > 0 ? fromUrl : DEFAULT_ROUND_SECONDS;
}

type RoundPhase = "play" | "timesUp" | "roundEnd";

// Recipes reference ingredients by id; fall back to array position for older data.
const ingredientById = (id: number): Ingredient | undefined =>
  ingredients.find((ing) => ing.id === id) ?? ingredients.at(id);

/** A player's shopping card for a server recipe, ticked off from their inventory. */
function shoppingStack(
  player: { id: string; name: string; color: string },
  recipe: Recipe,
  recipeNumber: number,
  inventory: Record<number, number>,
): RaceStack {
  return {
    ...player,
    recipe: recipeNumber,
    recipeName: recipe.name,
    phase: "shop",
    items: recipe.ingredients.map((needed, i) => {
      const ingredient = ingredientById(needed.id);
      return {
        kind: ingredient ? iconIdFor(ingredient) : "",
        rot: SHOP_ROTATIONS[i % SHOP_ROTATIONS.length],
        done: (inventory[needed.id] ?? 0) >= needed.count,
      };
    }),
  };
}

interface HostInterfaceProps {
  connection: GameConnection;
}

export function HostInterface({ connection }: HostInterfaceProps) {
  const [secondsLeft, setSecondsLeft] = useState(roundSeconds);
  const [phase, setPhase] = useState<RoundPhase>("play");

  useEffect(() => {
    if (phase !== "play") return;
    const id = setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "play" && secondsLeft === 0) setPhase("timesUp");
  }, [phase, secondsLeft]);

  useEffect(() => {
    if (phase !== "timesUp") return;
    const id = setTimeout(() => setPhase("roundEnd"), TIMES_UP_MS);
    return () => clearTimeout(id);
  }, [phase]);

  const players = connection.players
    .filter((player) => !player.isHost)
    .map((player, i) => ({
      id: player.id,
      name: player.name,
      color: LOBBY_COLORS[i % LOBBY_COLORS.length],
    }));

  if (phase === "roundEnd") {
    return (
      <div style={{ width: "100vw", height: "100dvh" }}>
        <RoundLeaderboard
          entries={players.map((player) => ({
            ...player,
            points: connection.scores[player.id] ?? 0,
          }))}
          onNextRound={() => {
            setSecondsLeft(roundSeconds());
            setPhase("play");
          }}
          onLobby={() => {
            window.location.href = "/";
          }}
        />
      </div>
    );
  }

  const order = connection.state.recipeOrder;
  // Inventories arrive with each state update (e.g. after a checkout).
  const inventories = new Map(
    connection.state.players.map((p) => [p.id, p.inventory ?? {}]),
  );
  // Per-player recipe progress isn't sent to clients yet, so every card shows the first recipe.
  const firstRecipe = order.at(0);
  const liveStacks: RaceStack[] = firstRecipe
    ? players.map((player) =>
        shoppingStack(player, firstRecipe, 1, inventories.get(player.id) ?? {}),
      )
    : [];

  const demo = liveStacks.length === 0;

  return (
    <div style={{ position: "relative", width: "100vw", height: "100dvh" }}>
      <HostRaceStacks
        stacks={demo ? DEMO_STACKS : liveStacks}
        totalRecipes={demo ? 5 : Math.max(1, order.length)}
        secondsLeft={secondsLeft}
        banner={
          demo
            ? players.length > 0
              ? "Waiting for recipes…"
              : "Demo chefs · nobody has joined"
            : undefined
        }
      />
      {phase === "timesUp" && <TimesUp />}
    </div>
  );
}
