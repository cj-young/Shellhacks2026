import type { Recipe, RecipeStage } from "#/lib/types";
import type { Gesture } from "./menu";
import { RECIPES, menuIngredientIdFor } from "./menu";
import ingredients from "./ingredients.json";
import stepTable from "./recipe-steps.json";

/**
 * Presentation for the team's recipes (backend/src/data/recipes.json). The
 * stages there only carry a gesture (lines/spin), geometry and what they
 * consume, so the names, host icons and placeholder art live in
 * recipe-steps.json, matched by recipe name and stage index. Gesture detection
 * is untouched. scripts/generate-step-art.mjs builds the art from the same file.
 */

/** Where a step happens; picks the placeholder art under the gesture. */
export type Station = "board" | "bowl" | "pan" | "pot" | "plate";

export type StepInfo = {
  /** Short instruction shown on the phone and the host card. */
  label: string;
  /** Host card icon; "plate" shows the finished dish. */
  gesture: Gesture;
  /** Big word on the host card. */
  word: string;
  station: Station;
};

const step = (
  label: string,
  gesture: Gesture,
  word: string,
  station: Station,
): StepInfo => ({ label, gesture, word, station });

// One entry per stage, in the same order as recipes.json.
const STEPS = Object.fromEntries(
  Object.entries(stepTable).filter(([key]) => !key.startsWith("_")),
) as unknown as Record<string, StepInfo[]>;

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

/** Fallback when a recipe or stage isn't in the table: read it off the gesture. */
function derivedStep(stage: RecipeStage | undefined): StepInfo {
  if (stage?.type === "spin") return step("Stir it", "stir", "STIR!", "bowl");
  const lines = stage?.type === "lines" ? stage.lines : [];
  const upward =
    lines.length === 1 &&
    lines[0].start.y > lines[0].end.y &&
    Math.abs(lines[0].end.x - lines[0].start.x) <
      Math.abs(lines[0].end.y - lines[0].start.y);
  if (upward) return step("Flip it", "flip", "FLIP!", "pan");
  return step("Chop it", "chop", "CHOP!", "board");
}

export function stepInfo(
  recipeName: string,
  stageIndex: number,
  stage?: RecipeStage,
): StepInfo {
  return STEPS[normalize(recipeName)]?.[stageIndex] ?? derivedStep(stage);
}

/** How to do the stage's gesture, read from its data. */
export function gestureHint(stage: RecipeStage | undefined): string {
  if (!stage) return "";
  if (stage.type === "spin") {
    const spin = stage.spins[0];
    if (!spin) return "Draw a circle";
    const turns = spin.rotations === 1 ? "once" : `${spin.rotations} times`;
    return spin.direction === "clockwise"
      ? `↻ Circle clockwise ${turns}`
      : `↺ Circle counter-clockwise ${turns}`;
  }
  return stage.lines.length > 1
    ? "Swipe the zig-zag, start to end"
    : "Swipe along the line";
}

/** Our dish art id for a server recipe (e.g. "Spaghetti & Meatballs" → spaghetti). */
export function menuRecipeIdFor(name: string): string | undefined {
  const n = normalize(name);
  return RECIPES.find((r) => {
    const m = normalize(r.name);
    return m === n || m.includes(n) || n.includes(m);
  })?.id;
}

// Test pictures the team's recipes use until real stage art exists.
const PLACEHOLDER_IMAGES = new Set([
  "/SlicedBreadTest.jpg",
  "/SlicedBreadTest2.jpg",
  "/FlourTest.webp",
]);
const isPlaceholder = (src?: string) => !src || PLACEHOLDER_IMAGES.has(src);

/** Ingredients a stage uses up, as our art ids. */
function consumedArt(stage: RecipeStage): string[] {
  return Object.entries(stage.ingredientsConsumed ?? {})
    .filter(([, count]) => count > 0)
    .map(([id]) => ingredients.find((i) => i.id === Number(id)))
    .map((ing) => (ing ? menuIngredientIdFor(ing.name) : undefined))
    .filter((id): id is string => Boolean(id))
    .slice(0, 2);
}

/**
 * Swaps the recipe's test pictures for placeholder station art (with the
 * ingredient being used). Real art in recipes.json is left alone. The finished
 * picture stays set so the stage still pauses on "Success!" like the data asks.
 */
export function withStepArt(recipe: Recipe): Recipe {
  return {
    ...recipe,
    stages: recipe.stages.map((stage, i) => {
      const info = stepInfo(recipe.name, i, stage);
      const art = consumedArt(stage);
      const scene = `/assets/steps/${[info.station, ...art].join("-")}.svg`;
      return {
        ...stage,
        backgroundImage: isPlaceholder(stage.backgroundImage)
          ? scene
          : stage.backgroundImage,
        image: isPlaceholder(stage.image) ? undefined : stage.image,
        finishedImage: isPlaceholder(stage.finishedImage)
          ? "/assets/steps/done.svg"
          : stage.finishedImage,
      };
    }),
  };
}
