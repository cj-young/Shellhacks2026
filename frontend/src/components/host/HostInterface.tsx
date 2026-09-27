import type { GameConnection } from "#/lib/use-game-connection";
import type { Ingredient, Recipe } from "#/lib/types";
import { useEffect, useState } from "react";
import ingredients from "../../data/ingredients.json";
import {
  DEMO_STACKS,
  HostRaceStacks,
} from "#/components/chop-chop/screens/HostRaceStacks";
import type { RaceStack } from "#/components/chop-chop/screens/HostRaceStacks";
import { lobbyColor } from "#/components/chop-chop/screens/HostLobbyNew";
import { TimesUp } from "#/components/chop-chop/screens/TimesUp";
import { RoundLeaderboard } from "#/components/chop-chop/screens/RoundLeaderboard";
import { iconIdFor } from "#/components/client/Store";
import { menuRecipeIdFor, stepInfo } from "#/data/recipe-steps";

const TIMES_UP_MS = 3000;
const SHOP_ROTATIONS = [-6, 5, -4, 6];

// Recipe ingredients reference ingredients.json by id (same as the team's host screen).
const ingredientById = (id: number): Ingredient | undefined =>
  ingredients.find((entry) => entry.id === id);

type ServerPlayer = GameConnection["state"]["players"][number];

/**
 * A player's card follows their networked store/recipe mode. Shopping checkmarks
 * still reflect their cart and inventory.
 */
function playerStack(
  player: {
    id: string;
    name: string;
    color: string;
    character: string | null;
    points: number;
  },
  server: ServerPlayer | undefined,
  order: Recipe[],
): RaceStack | null {
  const recipeIndex = Math.min(server?.recipeIndex ?? 0, order.length - 1);
  const recipe = order.at(recipeIndex);
  if (!recipe) return null;

  const owned = (id: number) =>
    (server?.inventory[id] ?? 0) + (server?.cart[id] ?? 0);
  const stageIndex = server?.recipeStageIndex ?? 0;
  const hasEverything = recipe.ingredients.every(
    (needed) => (server?.inventory[needed.id] ?? 0) >= needed.count,
  );
  const base = {
    ...player,
    recipe: recipeIndex + 1,
    recipeName: recipe.name,
    allDone: (server?.recipeIndex ?? 0) >= order.length,
  };

  if (server?.interfaceState === "recipe") {
    // Step name and icon for the stage they're on (see data/recipe-steps).
    const current = Math.min(stageIndex, recipe.stages.length - 1);
    const info = stepInfo(recipe.name, current, recipe.stages.at(current));
    return {
      ...base,
      phase: "prep",
      gesture: info.gesture,
      dish: menuRecipeIdFor(recipe.name),
      gestureName: info.word,
      stepLabel: info.label,
      step: current + 1,
      steps: Math.max(1, recipe.stages.length),
    };
  }

  return {
    ...base,
    phase: "shop",
    items: recipe.ingredients.map((needed, i) => {
      const ingredient = ingredientById(needed.id);
      return {
        kind: ingredient ? iconIdFor(ingredient) : "",
        rot: SHOP_ROTATIONS[i % SHOP_ROTATIONS.length],
        done: owned(needed.id) >= needed.count,
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

  const serverPlayers = new Map(connection.state.players.map((p) => [p.id, p]));
  // Live score: the authoritative player score from the server's state.
  const livePoints = (id: string) => serverPlayers.get(id)?.score ?? 0;

  const players = connection.players
    .filter((player) => !player.isHost)
    .map((player, i) => ({
      id: player.id,
      name: player.name,
      color: lobbyColor(player.character, i),
      character: player.character,
      points: livePoints(player.id),
    }));

  if (results && showLeaderboard) {
    const scoreFor = (id: string) =>
      Math.max(
        results.find((r) => r.playerId === id)?.score ?? 0,
        serverPlayers.get(id)?.score ?? 0,
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
  // Cart, inventory and recipe progress arrive with each state update from the server.
  const liveStacks: RaceStack[] = players
    .map((player) => playerStack(player, serverPlayers.get(player.id), order))
    .filter((stack): stack is RaceStack => stack !== null);

  const demo = liveStacks.length === 0;

  return (
    <div style={{ position: "relative", width: "100vw", height: "100dvh" }}>
      <HostRaceStacks
        stacks={demo ? DEMO_STACKS : liveStacks}
        totalRecipes={demo ? 5 : Math.max(1, order.length)}
        secondsLeft={secondsLeft}
        intro
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
