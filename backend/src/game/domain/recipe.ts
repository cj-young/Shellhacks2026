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
  /** How long the player has on this stage before it fails; null/absent = no limit. */
  timeLimitMs?: number | null;
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
