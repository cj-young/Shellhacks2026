/**
 * Backend endpoints.
 *
 * In development the frontend is served same-origin behind Caddy, which strips
 * the `/api` prefix before proxying to the backend. In production the frontend
 * (Vercel) and backend (Railway) live on different origins, so these come from
 * `VITE_*` environment variables set at build time. The defaults keep the
 * local/Caddy setup working without any env vars.
 */

const read = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

/** Base URL for REST calls. */
export const API_URL = read(import.meta.env.VITE_API_URL) ?? "/api";

/** Socket.IO origin; empty string means "the current origin" (development). */
export const SOCKET_URL = read(import.meta.env.VITE_SOCKET_URL) ?? "";

/**
 * Socket.IO path. Caddy exposes the backend at `/api/socket.io/`; the backend
 * itself serves Socket.IO at `/socket.io/`.
 */
export const SOCKET_PATH =
  read(import.meta.env.VITE_SOCKET_PATH) ?? "/api/socket.io/";

/** Full URL for a backend REST path, e.g. `apiUrl("/games")`. */
export const apiUrl = (path: string) => `${API_URL}${path}`;
