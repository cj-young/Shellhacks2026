import { createServer } from "node:http";

import { createApp } from "./app.ts";
import { createGameModule } from "./game/index.ts";
import { parseAllowedOrigins } from "./origins.ts";
import { createRealtimeModule } from "./realtime/index.ts";

const PORT = Number(process.env.PORT ?? 3001);
const roundDurationMs = process.env.ROUND_DURATION_MS
  ? Number(process.env.ROUND_DURATION_MS)
  : undefined;
const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);

const game = createGameModule();
const app = createApp({ gameRouter: game.router, allowedOrigins });
const server = createServer(app);

createRealtimeModule({
  server,
  gameService: game.service,
  allowedOrigins,
  roundDurationMs,
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
