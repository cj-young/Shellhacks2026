import { Router } from "express";
import type { Request, Response } from "express";

import type { GameService } from "../application/game-service.ts";

export function createGameRouter(gameService: GameService): Router {
  const router = Router();

  router.post("/", async (_req: Request, res: Response) => {
    const game = await gameService.createGame();
    res.status(201).json({ code: game.code, hostToken: game.hostToken });
  });

  // Lets the host check whether a persisted game is still usable before
  // reusing its code (e.g. after the round ended or the server restarted).
  router.get("/:code", async (req: Request, res: Response) => {
    const game = await gameService.getGame(String(req.params.code));
    if (!game) {
      res.status(404).json({ error: "GAME_NOT_FOUND" });
      return;
    }
    res.json({ code: game.code, status: game.status });
  });

  return router;
}
