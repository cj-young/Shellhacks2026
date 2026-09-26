import { createServer } from "node:http";

import { createApp } from "./app.ts";
import { createGameModule } from "./game/index.ts";
import { createRealtimeModule } from "./realtime/index.ts";

const PORT = Number(process.env.PORT ?? 3001);
const roundDurationMs = process.env.ROUND_DURATION_MS
  ? Number(process.env.ROUND_DURATION_MS)
  : undefined;

const game = createGameModule();
const app = createApp({ gameRouter: game.router });
const server = createServer(app);

createRealtimeModule({
  server,
  gameService: game.service,
  roundDurationMs,
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
