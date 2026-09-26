import type { GameConnection } from "#/lib/use-game-connection";
import { useEffect, useState } from "react";
import recipes from "../../data/recipes.json";
import {
  DEMO_STACKS,
  HostRaceStacks,
  stackFor,
} from "#/components/chop-chop/screens/HostRaceStacks";
import { RECIPES as MENU_RECIPES } from "#/data/menu";
import type { RaceStack } from "#/components/chop-chop/screens/HostRaceStacks";
import { LOBBY_COLORS } from "#/components/chop-chop/screens/HostLobbyNew";
import { TimesUp } from "#/components/chop-chop/screens/TimesUp";
import { RoundLeaderboard } from "#/components/chop-chop/screens/RoundLeaderboard";

const DEFAULT_ROUND_SECONDS = 60;
const TIMES_UP_MS = 3000;

/** `/host?round=10` shortens rounds for testing. */
function roundSeconds() {
  if (typeof window === "undefined") return DEFAULT_ROUND_SECONDS;
  const fromUrl = Number(
    new URLSearchParams(window.location.search).get("round"),
  );
  return fromUrl > 0 ? fromUrl : DEFAULT_ROUND_SECONDS;
}

type RoundPhase = "play" | "timesUp" | "roundEnd";

interface HostInterfaceProps {
  connection: GameConnection;
}

export function getRandomIntInclusive(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function HostInterface({ connection }: HostInterfaceProps) {
  function generateRecipeOrder(length: number) {
    const res: number[] = [];
    let i = 0;

    while (i < length) {
      const select = getRandomIntInclusive(0, recipes.length - 1);
      if (!res.includes(select)) {
        res.push(select);
        i++;
      }
    }

    return res;
  }

  const [recipeOrder, setRecipeOrder] = useState<number[]>([]);

  useEffect(() => {
    setRecipeOrder(generateRecipeOrder(3));
  }, []);

  useEffect(() => {
    if (recipeOrder.length != 0)
      connection.socketRef.current?.emit("send_recipe_order", recipeOrder);
  }, [recipeOrder]);

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

  if (phase === "roundEnd") {
    const entries = connection.players
      .filter((player) => !player.isHost)
      .map((player, i) => ({
        id: player.id,
        name: player.name,
        color: LOBBY_COLORS[i % LOBBY_COLORS.length],
        points: connection.scores[player.id] ?? 0,
      }));
    return (
      <div style={{ width: "100vw", height: "100dvh" }}>
        <RoundLeaderboard
          entries={entries}
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
  const players = connection.players.filter((player) => !player.isHost);
  // The server's recipes don't carry ingredients yet, so cards use the menu recipe with the
  // same name when there is one, otherwise the first menu recipe.
  const recipe =
    MENU_RECIPES.find((r) => r.name === order.at(0)?.name) ?? MENU_RECIPES[0];

  // No per-player progress is sent yet, so every chef starts out shopping with an empty basket.
  const liveStacks: RaceStack[] = players.map((player, i) =>
    stackFor(
      {
        id: player.id,
        name: player.name,
        color: LOBBY_COLORS[i % LOBBY_COLORS.length],
      },
      recipe,
      1,
      { phase: "shop", inBasket: [] },
    ),
  );

  const demo = liveStacks.length === 0;

  return (
    <div style={{ position: "relative", width: "100vw", height: "100dvh" }}>
      <HostRaceStacks
        stacks={demo ? DEMO_STACKS : liveStacks}
        totalRecipes={demo ? 5 : Math.max(1, order.length)}
        secondsLeft={secondsLeft}
        banner={demo ? "Demo chefs · nobody has joined" : undefined}
      />
      {phase === "timesUp" && <TimesUp />}
    </div>
  );
}
