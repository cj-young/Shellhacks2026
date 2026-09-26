import express, { type Express, type Request, type Response } from 'express';

import { createGameModule } from './game/index.ts';

const app: Express = express();

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.use('/games', createGameModule());

app.listen(3001, () => {
  console.log('Server is running on http://localhost:3001');
});
