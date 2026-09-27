import express, {
  type Express,
  type Request,
  type Response,
  type Router,
} from "express";

import { isOriginAllowed } from "./origins.ts";

export interface AppDependencies {
  gameRouter: Router;
  /** Browser origins allowed to call the API (see `origins.ts`). */
  allowedOrigins?: readonly string[];
}

export function createApp({
  gameRouter,
  allowedOrigins,
}: AppDependencies): Express {
  const app = express();
  app.disable("x-powered-by");

  // The frontend is hosted separately (Vercel), so the REST API has to answer
  // cross-origin requests. There are no cookies or auth headers, so a simple
  // reflected `Access-Control-Allow-Origin` is enough.
  app.use((req: Request, res: Response, next) => {
    const origin = req.headers.origin;
    if (origin && isOriginAllowed(origin, req.headers.host, allowedOrigins)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }

    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.sendStatus(204);
      return;
    }

    next();
  });

  app.use(express.json());

  app.get("/", (_req: Request, res: Response) => {
    res.send("Hello World!");
  });

  // Railway / load-balancer health check.
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/games", gameRouter);

  return app;
}
