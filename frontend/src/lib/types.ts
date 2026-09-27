export function MakeEmptyState() {
  return {
    recipeOrder: [],
    players: [],
  } as GameState;
}

export type PlayerSummary = {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
  connected: boolean;
  cart: Record<number, number>;
  inventory: Record<number, number>;
  recipeIndex: number;
  recipeStageIndex: number;
  score: number;
  stageDeadlineAt: number | null;
};

export type GameState = {
  recipeOrder: Recipe[];
  players: PlayerSummary[];
};

export type Recipe = {
  name: string;
  ingredients: { id: number; count: number }[];
  stages: RecipeStage[];
};

export type RecipeStage = {
  /** Decorative image rendered behind the foreground image. */
  backgroundImage?: string;
  image?: string;
  /** Optional foreground shown briefly after completing this stage. */
  finishedImage?: string;
  /** How long the player has on this stage before it fails; null/absent = no limit. */
  timeLimitMs?: number | null;
  ingredientsConsumed: Record<number, number>;
} & (
  { type: "lines"; lines: LineType[] } | { type: "spin"; spins: SpinType[] }
);

export type SpinDirection = "clockwise" | "counterclockwise";

export type SpinType = {
  center: Point;
  /** Distance from the center to the circular target, in pixels. */
  radius: number;
  /** Accepted distance on either side of the target ring, less than radius. */
  tolerance: number;
  direction: SpinDirection;
  rotations: number;
};

export type LineType = {
  start: Point;
  end: Point;
  radius: number;
};

export type Point = {
  x: number;
  y: number;
};

export type Ingredient = {
  id: number;
  name: string;
  image: string;
  category: string;
};
