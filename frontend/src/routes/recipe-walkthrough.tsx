import { createFileRoute } from "@tanstack/react-router";
import { RecipeWalkthrough } from "../components/dev/RecipeWalkthrough";

export const Route = createFileRoute("/recipe-walkthrough")({
  component: RecipeWalkthrough,
});
