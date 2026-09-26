import { createFileRoute } from "@tanstack/react-router";
import { PracticeGame } from "#/components/chop-chop/player/PracticeGame";

export const Route = createFileRoute("/practice")({ component: PracticeGame });
