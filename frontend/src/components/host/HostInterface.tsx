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

const ROUND_SECONDS = 60;

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

  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);

  useEffect(() => {
    const id = setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, []);

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
    <div style={{ width: "100vw", height: "100dvh" }}>
      <HostRaceStacks
        stacks={demo ? DEMO_STACKS : liveStacks}
        totalRecipes={demo ? 5 : Math.max(1, order.length)}
        secondsLeft={secondsLeft}
        banner={demo ? "Demo chefs · nobody has joined" : undefined}
      />
    </div>
  );
}
