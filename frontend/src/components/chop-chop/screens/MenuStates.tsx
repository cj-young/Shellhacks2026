import { PINK, ROYAL, TOMATO } from "../design";
import { getRecipe } from "#/data/menu";
import type { MenuRecipe } from "#/data/menu";
import { AISLES, RecipeCard } from "../player/PracticeGame";
import { HostRaceStacks, stackFor } from "./HostRaceStacks";
import {
  ChopScreen,
  PlatingScreen,
  StoreScreen,
  StoveScreen,
} from "./RacePhoneScreens";

// Dev-switcher previews driven by src/data/menu.json.

const recipe = (id: string) => getRecipe(id) as MenuRecipe;
const players = [
  { id: "mina", name: "Mina", color: ROYAL },
  { id: "jun", name: "Jun", color: TOMATO },
  { id: "ari", name: "Ari", color: "#159A6B" },
  { id: "leo", name: "Leo", color: PINK },
];

export function HostMenuShopping() {
  return (
    <HostRaceStacks
      totalRecipes={3}
      secondsLeft={48}
      stacks={[
        stackFor(players[0], recipe("tacos"), 1, {
          phase: "shop",
          inBasket: ["tortilla"],
        }),
        stackFor(players[1], recipe("cheeseburger"), 1, {
          phase: "shop",
          inBasket: ["burger-bun", "ground-beef", "cheese"],
        }),
        stackFor(players[2], recipe("pancakes"), 1, {
          phase: "shop",
          inBasket: [],
        }),
        stackFor(players[3], recipe("guacamole"), 1, {
          phase: "shop",
          inBasket: ["avocado", "lime"],
        }),
      ]}
    />
  );
}

export function HostMenuPrepping() {
  return (
    <HostRaceStacks
      totalRecipes={3}
      secondsLeft={21}
      stacks={[
        stackFor(players[0], recipe("spaghetti"), 2, {
          phase: "prep",
          step: 3,
        }),
        stackFor(players[1], recipe("steak-potatoes"), 2, {
          phase: "prep",
          step: 3,
        }),
        stackFor(players[2], recipe("fried-rice"), 1, {
          phase: "prep",
          step: 1,
        }),
        stackFor(players[3], recipe("omelette"), 3, { phase: "prep", step: 5 }),
      ]}
    />
  );
}

export function PlayerRecipeCardTacos() {
  return <RecipeCard framed recipe={recipe("tacos")} index={0} total={3} />;
}

export function PlayerStoreProduce() {
  const aisle = AISLES[0];
  const basket = ["tomato", "lettuce"];
  return (
    <StoreScreen
      score={600}
      progress={10}
      aisleName={aisle.name}
      aisleIndex={0}
      aisleCount={AISLES.length}
      shelf={aisle.items.map((kind) =>
        basket.includes(kind) ? null : { kind },
      )}
      basket={basket}
    />
  );
}

export function PlayerChopTacos() {
  return (
    <ChopScreen
      score={650}
      progress={45}
      basket={["tortilla", "ground-beef"]}
      queue={["tomato", "lettuce"]}
      current={1}
      chops={1}
    />
  );
}

export function PlayerFlipCheeseburger() {
  return (
    <StoveScreen
      score={900}
      progress={40}
      basket={["lettuce"]}
      panItems={["ground-beef", "burger-bun", "cheese"]}
      gesture="flip"
    />
  );
}

export function PlayerPlatePancakes() {
  return (
    <PlatingScreen
      score={1450}
      progress={94}
      basket={["sugar"]}
      dish="pancakes"
    />
  );
}
