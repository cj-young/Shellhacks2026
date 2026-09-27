# Chop Chop!

**Chop Chop!** is a competitive, Jackbox-style cooking party game built as a PWA. One shared host
screen (laptop or TV) shows everyone's recipes, and each player uses their phone as their personal
store and kitchen. Players race through the same series of recipes, shopping from memory and cooking
with gestures, while the last-place player gets sabotages to catch up.

This file is the single source of truth for agents working in this repo: the product summary, a map
of the repository, the architecture, commands, conventions, and gotchas.

## Product

### Overview

- Host and phones run as a web app (PWA), so no install is needed.
- Phones connect to the host through a realtime server using a room code.
- The host holds the game state (recipes, timers, scores, sabotage rules). Phones send gestures and
  actions.
- A dev mode lets the team flip through every screen and state with mock data, without needing the
  backend.

### Joining

- The host screen shows a lobby with a QR code, a room code, and a Start button.
- Players scan the code or enter it on their phone, type their name, and pick a chef. Chefs already
  taken are dimmed and labeled.
- New players pop onto the host screen as they join. The game supports up to 4–5 players.
- Once joined, the phone shows a waiting screen ("Look at the big screen!") in the player's color
  until the host starts the game.

### Round structure

- The round is timed, with a countdown shown at the top of the host screen.
- Every player gets the same randomly generated sequence of recipes and works through it at their own
  pace.
- Each recipe has two phases: gathering ingredients at the store, then prepping the dish at the
  station.

### Phase 1: Ingredient gathering

- The host shows each player's current recipe card with the ingredients they need as large icons.
- The ingredient list appears only on the host. Players have to look up, remember what they need, and
  shop from memory.
- On the phone, the store is a set of shelves by category (Produce, Dairy, Meat, Pantry, Spices,
  Bakery). Players switch shelves with left/right arrows and drag items into the basket at the bottom
  of the screen.
- Some ingredients look alike (lemon/lime, tomato/red pepper) to make the glance at the host matter.
- As items go into a basket, they're checked off on that player's host recipe card.
- When ready, the player taps "Leave store." The phone doesn't say whether the basket is correct.
- **Too many ingredients:** the player loses points for food waste. Extras can be thrown out using the
  trash can.
- **Too few ingredients:** the player can start prepping, but has to go back to the store to get what's
  missing. While they're gone, the food at their station starts spoiling on a timer. If they don't
  make it back in time, the food goes bad.

### Phase 2: Prep

- The host recipe card switches to prep mode, showing numbered steps (1–5). The current step's gesture
  is the main visual on the card, and it updates live as the player completes each step.
- The phone shows the basket at the top and the current station below it. Players drag ingredients from
  the basket onto the station and do the gesture:
  - **Chop:** swipe on a cutting board. A row of queued ingredients shows what's left to chop.
  - **Stir / flip:** circle or flick on a pan over a burner.
  - **Plate:** assemble the finished dish and tap "Serve!"
- The phone never shows the recipe or the next step. Players have to check the host to know what to do.
- Serving a dish completes the recipe and moves the player to their next recipe in the sequence.

### Sabotage

- When every player except one has moved on to the next recipe, the last player unlocks a sabotage.
  The host announces it with a big banner.
- **Steal:** take an ingredient from another player's basket. The victim's phone shows a cartoon hand
  grabbing from their basket and an alert ("Jun stole your tomato!"), and the host shows the ingredient
  moving between players.
- **Blackout:** affects everyone's store. Ingredients on phones turn into silhouettes, while the host
  still shows them in full color, so players have to cross-check the big screen to shop.

### Host screen (during play)

- Top: round timer.
- Middle: one recipe card stack per player, showing either the ingredient checklist (gathering) or the
  numbered steps and current gesture (prep). Cards stacked behind show upcoming recipes.
- Bottom: a tab for each player with their avatar and name.
- Overlays: sabotage announcements, blackout, steals, food waste penalties, and spoil timers.

### Phone (during play)

- Top bar: avatar with a reactive expression (happy, focused, worried), a recipe progress bar, and the
  player's score.
- Main area: the store, or the basket plus the current station.
- A trash can for throwing out extra ingredients.

### Scoring and winning

- Points are earned for completed dishes. Points are lost for food waste and spoiled food.
- When the timer runs out, the player with the highest score wins. A victory screen shows the final
  rankings.

## Tech stack

| Area          | Choices                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------- |
| Frontend      | React 19, TanStack Start + TanStack Router (file routes), Vite 8, Tailwind CSS v4, `socket.io-client` |
| Backend       | Node 24, Express 5, Socket.IO 4, TypeScript executed directly (type stripping, no build)  |
| Realtime      | Socket.IO over WebSockets; the browser talks to the backend through Caddy                  |
| Infra         | Docker Compose (`backend`, `frontend`, `caddy`); Caddy is the only public entrypoint        |
| Tooling       | Prettier + ESLint (ESLint 9 frontend, ESLint 10 backend), `node:test` test runner          |
| Package mgr   | npm (lockfiles committed per package)                                                      |

## Repository layout

```
.
├── AGENTS.md                 # This file
├── Makefile                  # Dev/ops commands (up, test, lint, format, check, typecheck, verify…)
├── docker-compose.yml        # backend, frontend, caddy services
├── Caddyfile                 # Public routing on :80 (published as :8080)
├── design/                   # Design-handoff prototypes — REFERENCE ONLY, not imported
│   ├── Chop Chop Board design-handoff/chop-chop-board-design/…   # README + .dc.html canvas prototypes
│   └── ChopChop Board design-handoff/chop-chop-board-design/…    # superset bundle (adds Basket/Ingredient/Recipe Race)
├── backend/
│   ├── Dockerfile            # node:24-alpine, npm ci, runs `node --watch src/server.ts`
│   ├── package.json          # scripts: test, test:watch, start, lint, format, check, typecheck
│   ├── tsconfig.json         # nodenext, erasableSyntaxOnly, verbatimModuleSyntax, noEmit
│   ├── eslint.config.js      # flat config (typescript-eslint + eslint-config-prettier)
│   ├── prettier.config.js    # semi: true, singleQuote: false, trailingComma: all
│   ├── openapi.yaml          # REST contract (OpenAPI 3.1)
│   ├── asyncapi.yaml         # Realtime contract (AsyncAPI 3.1)
│   ├── test.http             # scratch HTTP request (POST /api/games)
│   └── src/
│       ├── server.ts         # Composition root: builds app + realtime, listens on PORT (3001)
│       ├── app.ts            # createApp({ gameRouter }) — Express app factory
│       ├── util.ts           # getRandomIntInclusive / generateRecipeOrder (reads data/recipes.json)
│       ├── data/recipes.json # Server-side recipe catalogue
│       ├── game/             # DDD module: games, codes, host token, game state
│       │   ├── domain/       # game.ts (Game, GameState, Recipe…), code.ts (codes/token)
│       │   ├── ports/        # game-store.ts (port interface)
│       │   ├── infrastructure/# in-memory-game-store.ts (adapter)
│       │   ├── application/  # game-service.ts (createGame/getGame/startGame)
│       │   ├── http/         # game-routes.ts (POST /games)
│       │   └── index.ts      # createGameModule() composition root
│       └── realtime/         # DDD module: lobbies, players, Socket.IO
│           ├── domain/       # player.ts, protocol.ts (typed event maps)
│           ├── application/  # game-session.ts (join/start use-cases)
│           ├── infrastructure/socketio/socketio-gateway.ts
│           └── index.ts      # createRealtimeModule() composition root
└── frontend/
    ├── Dockerfile            # node:24-alpine, npm ci, `vite dev` on 0.0.0.0:3000
    ├── package.json          # scripts: dev, generate-routes, build, preview, lint, format, check, typecheck
    ├── vite.config.ts        # tanstackStart + react + tailwindcss, allowedHosts: true
    ├── tsr.config.json       # TanStack Router codegen config
    ├── eslint.config.js      # @tanstack/eslint-config + eslint-config-prettier
    ├── prettier.config.js    # same style as backend
    ├── README.md             # TanStack Start boilerplate
    ├── public/               # SlicedBreadTest*.jpg sample stage art
    └── src/
        ├── routeTree.gen.ts  # GENERATED by TanStack Router — do not edit
        ├── router.tsx        # Router factory
        ├── styles.css        # Tailwind entry + fonts; imports styles/theme.css
        ├── styles/theme.css  # CSS custom-property design tokens
        ├── routes/           # File-based routes: /, /host, /join, /chop-chop-dev, __root
        ├── audio/            # Web Audio engine, cue resolution, audio hooks
        ├── lib/
        │   ├── use-game-connection.ts  # Socket.IO client hook (lobby + game state)
        │   └── types.ts                # Shared GameState/Recipe types (mirror backend)
        ├── components/
        │   ├── CursorPathTracker.tsx / LineTarget.tsx / GestureRecipe.tsx / MasterRecipe.tsx
        │   ├── HostInterface.tsx       # Post-start host placeholder
        │   ├── client/ClientInterface.tsx  # Post-start phone placeholder
        │   └── chop-chop/             # Design system + dev screen gallery (see below)
        └── data/
            ├── recipes.json           # Mirror of backend catalogue
            ├── sounds.ts              # Sound registry (edit to plug in audio)
            └── chop-chop-mock.ts      # Mock presentation data (dev screens only)
```

## Architecture

### Runtime topology

```
Browser ──▶ Caddy :8080 ──┬─ /api/*  ──▶ backend :3001   (Caddy strips the /api prefix)
                          ├─ /api    ──▶ backend :3001
                          └─ everything else ──▶ frontend :3000 (Vite dev server, HMR)
```

- **The only public port is `8080`** (Caddy). Backend `3001` and frontend `3000` are internal
  (`expose`, not published).
- Caddy's `handle_path /api*` strips `/api` before proxying, so the backend mounts routes at
  `/games`, `/socket.io/`, etc. The Socket.IO client connects to **`/api/socket.io/`**.
- `backend/src/server.ts` is the composition root; `createApp` and `createRealtimeModule` are wired
  with a shared `GameService`.

### Backend

The backend is a small ports-and-adapters (hexagonal) codebase split into two DDD modules plus a thin
bootstrap. Dependencies point inward: `http`/`infrastructure` → `application` → `domain`/`ports`.

**`game/` — games, codes, and game state**

- `domain/game.ts` — `Game` (`code`, `hostToken`, `status: "lobby" | "active"`, `createdAt`, `state`),
  `GameState` (`{ recipeOrder: Recipe[] }`), `Recipe`/`RecipeStage`/`LineType`/`Point`, `MakeEmptyState()`.
- `domain/code.ts` — `generateGameCode()` (6 chars from an unambiguous alphabet, no `0/O/1/I/L`),
  `generateHostToken()`, `normalizeGameCode()`.
- `ports/game-store.ts` — `GameStore` interface (`createIfAbsent`, `get`, `save`, `delete`).
- `infrastructure/in-memory-game-store.ts` — `Map`-backed adapter (the only place that touches storage).
- `application/game-service.ts` — `createGame()`, `getGame(code)`, `startGame(code)` (lobby → active,
  generates the recipe order via `util.generateRecipeOrder(3)` and persists it).
- `http/game-routes.ts` — `POST /games` → `201 { code, hostToken }`.
- `index.ts` — `createGameModule()` returns `{ router, service }`.

**`realtime/` — lobbies, players, and Socket.IO**

- `domain/player.ts` — `PlayerSummary` (`id`, `name`, `joinedAt`, `isHost`) and
  `normalizePlayerName()` (trim, collapse whitespace, cap 20 chars).
- `domain/protocol.ts` — typed Socket.IO event maps:
  - Server→client: `joined`, `player_joined`, `player_left`, `game_started`, `game_error`,
    `update_state`
  - Client→server: `start_game`, `send_recipe_order`
  - `SocketData` carries the current `PlayerSummary`.
- `application/game-session.ts` — `GameSession.join()` (validates code, rejects active games with
  `GAME_STARTED`, resolves host from host token) and `GameSession.start()` (auth `NOT_HOST`, delegates
  the state transition to `GameService.startGame`).
- `infrastructure/socketio/socketio-gateway.ts` — `createSocketIoGateway()`: path `/socket.io/`,
  `serveClient: false`, 16 KB max payload, same-origin `allowRequest`, room per game (`game:<code>`),
  roster via `io.in(room).fetchSockets()`, and the broadcast/error wiring.
- `index.ts` — `createRealtimeModule({ server, gameService })` composition root.

**Recipes** — `src/data/recipes.json` is the server catalogue; `util.ts` picks a unique random subset.

**API contracts** — `openapi.yaml` documents `POST /api/games`; `asyncapi.yaml` documents the Socket.IO
events. Note: the AsyncAPI spec currently lags the code (it does not yet document `update_state` or
`send_recipe_order`), and the REST spec covers only game creation.

### Frontend

The frontend contains **two parallel paths**: the real, networked game and a mock-driven design/dev
gallery. They do not share components today.

**Production path (networked)**

- `/` (`routes/index.tsx`) — gesture recipe demo on a full-screen drawing canvas
  (`CursorPathTracker` + `MasterRecipe` with the first entry of `data/recipes.json`).
- `/host` (`routes/host.tsx`) — host flow: enter a name, `POST /api/games`, show/copy the code, list
  players, and Start. The `{ code, hostToken, name }` is persisted in `sessionStorage`.
- `/join` (`routes/join.tsx`) — player flow: enter name + code, connect, show the roster. Once the
  game starts it renders `ClientInterface`.
- `lib/use-game-connection.ts` — the Socket.IO client hook. Opens
  `io({ path: "/api/socket.io/", auth: { code, token, name } })` and exposes
  `{ socketRef, players, playerId, status, message, started, state }`; handles `joined`,
  `player_joined`, `player_left`, `game_started`, `game_error`, `update_state`.
- `lib/types.ts` — `GameState`/`Recipe`/`RecipeStage`/`LineType`/`Point` + `MakeEmptyState()`, mirroring
  the backend domain types.
- `components/HostInterface.tsx` — post-start host placeholder; generates a recipe order client-side
  and emits `send_recipe_order` (contains a scratch "test" emit button).
- `components/client/ClientInterface.tsx` — post-start phone placeholder; shows how many recipes have
  been received from `connection.state`.

**Gesture engine** (the actual game interaction)

- `CursorPathTracker.tsx` — captures a pointer trail (points in the stage's gesture space).
- `gesture-recognizer.ts` — the recognizer. Magic-Cat-Academy-style feature classification: it
  resamples the stroke, derives shape features (straightness, corners, signed turning), then matches
  the stage by shape + rough proximity. Line/zig-zag stages also require ~80% path coverage and both
  endpoints; stirs require most of the stage's configured rotations (80%, floor 1). `LineTarget`/
  `SpinGesture` only draw the stage's guides now; the connector/corridor and exact-rotation geometry
  are gone.
- `LineTarget.tsx` / `SpinGesture.tsx` — presentational guides for line and stir targets.
- `GestureRecipe.tsx` — recognizes the stroke against a stage and reports when it matches.
- `MasterRecipe.tsx` — runs a recipe's stages in order, advancing after each match.
- Tests: `gesture-recognizer.test.ts` (`node --test`) covers lines, zig-zags, loops, direction,
  proximity, path coverage and rotation requirements.

**Sound and music (`src/audio/` + `src/data/sounds.ts`)**

- `data/sounds.ts` — **the registry you edit to plug in audio**: a cue table plus the `SoundEvent`
  union. Every entry is optional, so anything unregistered is simply silent.
- `audio/engine.ts` — dependency-free engine: one-shot SFX go through Web Audio (low latency,
  pitch jitter) while music/ambience **loop through streamed `HTMLAudioElement`s** (long tracks start
  fast). Lazy `unlock()` from a user gesture, persisted mute + per-bus volumes, fades, and a silent
  no-op for missing files. Host music starts on the Start click.
- `audio/resolve.ts` — pure, tested key resolution, most-specific first: gesture
  (`stage:<recipe name>:<index>` → `gesture.success.<gesture>` → `gesture.success`), ambience
  (`ambient.<station>` → `ambient.default`), and exact keys for everything else.
- `audio/use-audio.ts` — hooks: `useSfx`, `useAmbient` (phone-only station loops), `useMusic` (host),
  `useAudioUnlock`.
- Wired in: `HostInterface` (music + round sounds), `ClientInterface` (ambience, gesture success/fail,
  recipe sounds), `Store` (`ui.*`), `SabotageUI` (`sabotage.*`).
- Assets live in `frontend/public/assets/audio/`; add a file there and a line in `data/sounds.ts`.


**Design system + dev gallery (`components/chop-chop/`) — dev/prototype, not wired to sockets**

- `design.tsx` / `race.tsx` / `Ingredient.tsx` — the newer design kit: hardcoded colors + fonts, SVG
  primitives, race-mode icons/phone chrome, and the canonical 27-ingredient set with lookalike pairs
  and silhouette (blackout) / worried (spoiling) states.
- Legacy components: `Avatar`, `Button`, `Card`, `Logo`, `Pill`, `PlayerPill`, `RoomCode`, `TextInput`.
- `FitToViewport.tsx` — scales fixed 1920×1080 / 410×864 canvases into the viewport.
- `ScreenSwitcher.tsx` — the mounted dev sidebar (used by `/chop-chop-dev`), showing the **new**
  `*New`/`RacePhone*` screens.
- `DevScreenSwitcher.tsx` + `index.ts` — older switcher and barrel that are **orphaned/dead** (nothing
  imports them).
- `screens/` — 16 screen components in two generations: legacy Tailwind screens (fed by
  `data/chop-chop-mock.ts`) and newer fixed-canvas `*New` / `RacePhone*` screens ported from the
  handoff. `RacePhoneScreens.tsx` exports the five race phone screens.
- `data/chop-chop-mock.ts` — mock presentation model/players/orders, used only by the legacy screens.

**`/chop-chop-dev`** (`routes/chop-chop-dev.tsx`) — mounts `ScreenSwitcher`, giving a backend-free
gallery of the new screens. This is the "dev mode" referenced in the product notes.

**Styling** — `styles.css` imports Google Fonts and `styles/theme.css`, then Tailwind v4. `theme.css`
holds the `:root` design tokens used by the legacy components. Caveat: the token palette
(`--ink`, fonts) and the hardcoded constants in `design.tsx` are not a single source of truth.

**`design/`** — two exported Claude Design handoff bundles (`.dc.html` prototypes + README). They are
visual references only and are never imported by the app.

## Commands and workflow

All app/test/tooling commands run **inside the containers** (there is no Node on the host). The
`Makefile` wraps `docker compose exec`.

| Command              | What it does                                                        |
| -------------------- | ------------------------------------------------------------------- |
| `make up`            | Build + start the stack in the foreground                           |
| `make up-d`          | Build + start the stack in the background                           |
| `make down`          | Stop and remove containers/networks                                  |
| `make build`         | Rebuild images                                                       |
| `make restart`       | Restart all services                                                 |
| `make logs`          | Tail logs                                                            |
| `make ps`            | Show running services                                                |
| `make sh-backend`    | Shell into the backend container                                     |
| `make sh-frontend`   | Shell into the frontend container                                    |
| `make test`          | Run the backend test suite (`node --test`)                           |
| `make lint`          | ESLint both packages (`lint-backend` / `lint-frontend`)              |
| `make format`        | Prettier + ESLint `--fix` both packages (writes files)               |
| `make check`         | `prettier --check` both packages                                     |
| `make typecheck`     | `tsc --noEmit` both packages                                         |
| `make verify`        | `check` + `lint` + `typecheck` + `test`                              |
| `make clean`         | Stop everything **and delete volumes** (use when adding dependencies)|

Per-package npm scripts: backend `test`, `test:watch`, `start`, `lint`, `format`, `check`,
`typecheck`; frontend `dev`, `generate-routes`, `build`, `preview`, `lint`, `format`, `check`,
`typecheck`.

The public app lives at **http://localhost:8080**.

## Deployment

The frontend is hosted on **Vercel** and the backend on **Railway** (a Node service). They are
separate origins, so the backend uses the `ALLOWED_ORIGINS` allowlist for CORS and Socket.IO
(see `backend/src/origins.ts`). Env examples live in `backend/.env.example` and
`frontend/.env.example`.

- **Backend (Railway)**: deploy from `backend/`. Railway runs `npm install` + `npm start`
  (`node src/server.ts`); `engines.node >= 24` selects Node 24, and Railway supplies `PORT`.
  Set `ALLOWED_ORIGINS=https://<vercel-app>` (wildcards like `https://*.vercel.app` allowed) and
  optionally `NODE_ENV=production` / `ROUND_DURATION_MS`. Health check path: `/health`. The game
  store is in-memory, so a redeploy/restart drops active games.
- **Frontend (Vercel)**: project root `frontend/`. The Nitro plugin selects the Vercel preset when
  `VERCEL` is set (i.e. during Vercel's build), so `vite build` emits `.vercel/output`; local builds
  emit `.output`. Set at build time:
  `VITE_API_URL=https://<railway-app>`, `VITE_SOCKET_URL=https://<railway-app>`,
  `VITE_SOCKET_PATH=/socket.io/`. Vite inlines these, so changing them needs a redeploy.
  With the env vars unset the app falls back to the Caddy `/api` paths used in development.
- **Optional single origin**: to hide the CORS allowlist, add a Vercel rewrite
  `{"rewrites":[{"source":"/api/:path*","destination":"https://<railway-app>/:path*"}]}` and leave
  `VITE_API_URL` at the default `/api`. Vercel rewrites do not proxy the WebSocket upgrade, so
  Socket.IO then falls back to long-polling; the two-origin setup above is recommended for
  realtime play.

## Conventions

### Backend

- ESM only (`"type": "module"`). Relative imports must include the **`.ts`** extension
  (`import x from "./foo.ts"`), because Node runs the source directly via type stripping.
- `tsconfig` enforces `erasableSyntaxOnly` and `verbatimModuleSyntax`: **no enums, no parameter
  properties, no namespaces**; use `import type` for types. `tsc --noEmit` is used only for type
  checking — there is no build step.
- Keep dependencies pointing inward and put composition roots in each module's `index.ts`.
- New stores/adapters implement the corresponding `ports/` interface; keep storage access out of
  application/domain code.

### Frontend

- File-based routing via TanStack Router. Add a file under `src/routes/`; the route tree is generated
  (`*.gen.ts` must not be edited). If new routes don't appear, run `npm run generate-routes`.
- Import alias `#/*` → `./src/*` (also `@/*` in tsconfig, mostly unused).
- Function components with `import type` for type-only imports.

### Style and tests

- Prettier: `semi: true`, `singleQuote: false`, `trailingComma: "all"` (configured in each package).
- ESLint flat configs; `eslint-config-prettier` is last so linting never fights formatting. Run
  `make format` after edits, then `make verify`.
- Backend tests use the built-in `node:test` runner and are **colocated** as `*.test.ts` next to the
  code. Unit tests use the in-memory adapters; `server.integration.test.ts` boots a real HTTP +
  Socket.IO server and uses `socket.io-client`.

## Gotchas

- **Bind mounts differ.** The frontend service mounts the whole `./frontend` directory, so source and
  config edits are live. The backend service mounts **only `./backend/src`**; changes to
  `backend/package.json`, `eslint.config.js`, `prettier.config.js`, `Dockerfile`, etc. require a
  rebuild (`make up-d` / `make build`).
- **Adding dependencies requires a volume reset.** Each service keeps `node_modules` in an anonymous
  volume. After changing dependencies, run `make clean` (removes volumes) then `make up-d`; otherwise
  the old `node_modules` is reused.
- **`node --watch` does not detect edits on `/mnt/c`** (Windows bind mounts). After editing backend
  source, `make restart` (or restart the backend container) instead of relying on hot reload.
- **Caddy strips `/api`.** The backend sees `/games` and `/socket.io/`, but clients use `/api/...`.
- **No build step.** Node 24 strips TypeScript types at runtime; `tsc` is only for type checking.
- **TypeScript is pinned to 6.0.x on the backend** because `typescript-eslint` cannot parse TypeScript
  7 (the native compiler exposes no JS API). Do not bump to TS 7 without changing the lint setup.
- **Game lifecycle limits:** `hostToken` is returned only at creation; joins are rejected once a game
  is `active` (`GAME_STARTED`); there is **no reconnect/resume** yet (a dropped host cannot rejoin).
- **Matchmaking is in-memory.** Restarting the backend drops all games.
- **`design/` is reference-only.** Never import from it; recreate designs in `components/chop-chop/`.
- The dev gallery has **two generations** (`*New`/`RacePhone*` vs legacy) plus a dead `index.ts` barrel
  and an orphaned `DevScreenSwitcher.tsx`. Don't assume a component is wired just because it exists.
- `__root.tsx` mounts `TanStackDevtools`; the app shell is SSR'd by TanStack Start, so browser-only
  APIs (sockets, `window`, `sessionStorage`) must stay inside effects/handlers.

## Where to add things

- **New REST endpoint** → `backend/src/game/http/` (or a new module), wired in that module's
  `index.ts`; update `backend/openapi.yaml`.
- **New realtime event** → add to `realtime/domain/protocol.ts`, handle it in
  `socketio-gateway.ts`, and add the client listener in `frontend/src/lib/use-game-connection.ts`;
  update `backend/asyncapi.yaml`.
- **New game state** → extend `game/domain/game.ts` and the transitions in
  `game/application/game-service.ts`; mirror the type in `frontend/src/lib/types.ts`.
- **New player/lobby rule** → `realtime/application/game-session.ts`.
- **New production screen** → a file route in `frontend/src/routes/` (+ components under
  `components/`), then `npm run generate-routes`.
- **New mock/dev screen** → `components/chop-chop/screens/` and register it in
  `ScreenSwitcher.tsx`.

## Open questions

- Whether extra ingredients can carry over to the next recipe.
- How often sabotages unlock after the first one, and whether there is a limit on how often one player
  can be targeted.
