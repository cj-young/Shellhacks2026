import { Router } from "express";
import type { Request, Response } from "express";

import type { GameService } from "../application/game-service.ts";

export function createGameRouter(gameService: GameService): Router {
  const router = Router();

  router.post("/", async (_req: Request, res: Response) => {
    const game = await gameService.createGame();
    res.status(201).json({ code: game.code, hostToken: game.hostToken });
  });

  return router;
}
