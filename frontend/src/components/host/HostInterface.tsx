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

const TIMES_UP_MS = 3000;
const SHOP_ROTATIONS = [-6, 5, -4, 6];

// Same lookup as the team's original host screen: recipe ingredient ids index into ingredients.json.
const ingredientById = (id: number): Ingredient | undefined =>
  ingredients.at(id);

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
  const [now, setNow] = useState(() => Date.now());
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { roundEndsAt, results } = connection;

  // The server owns the round clock (`timer_sync`); tick locally to redraw the countdown.
  useEffect(() => {
    if (results) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [results]);

  // When the server ends the game (`game_ended`), show "Time's up!" and then the leaderboard.
  useEffect(() => {
    if (!results) return;
    const id = setTimeout(() => setShowLeaderboard(true), TIMES_UP_MS);
    return () => clearTimeout(id);
  }, [results]);

  const players = connection.players
    .filter((player) => !player.isHost)
    .map((player, i) => ({
      id: player.id,
      name: player.name,
      color: LOBBY_COLORS[i % LOBBY_COLORS.length],
    }));

  if (results && showLeaderboard) {
    const scoreFor = (id: string) =>
      Math.max(
        results.find((r) => r.playerId === id)?.score ?? 0,
        connection.scores[id] ?? 0,
      );
    return (
      <div style={{ width: "100vw", height: "100dvh" }}>
        <RoundLeaderboard
          entries={players.map((player) => ({
            ...player,
            points: scoreFor(player.id),
          }))}
          hideNextRound
          onLobby={() => {
            window.location.href = "/";
          }}
        />
      </div>
    );
  }

  const secondsLeft =
    results || roundEndsAt === null
      ? 0
      : Math.max(0, Math.ceil((roundEndsAt - now) / 1000));

  const order = connection.state.recipeOrder;
  // Inventories arrive with each state update (e.g. after a checkout).
  const inventories = new Map(
    connection.state.players.map((p) => [p.id, p.inventory]),
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
      {results && <TimesUp />}
    </div>
  );
}
