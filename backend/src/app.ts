import express, { type Express, type Request, type Response, type Router } from 'express';

export interface AppDependencies {
  gameRouter: Router;
}

export function createApp({ gameRouter }: AppDependencies): Express {
  const app = express();

  app.use(express.json());

  app.get('/', (_req: Request, res: Response) => {
    res.send('Hello World!');
  });

  app.use('/games', gameRouter);

  return app;
}
