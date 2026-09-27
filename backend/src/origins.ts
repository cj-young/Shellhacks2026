/**
 * Browser-origin allowlist shared by the REST CORS middleware and the
 * Socket.IO gateway.
 *
 * `ALLOWED_ORIGINS` is a comma-separated list of origins. An entry may contain
 * a single `*` wildcard (e.g. `https://*.vercel.app`) to cover preview
 * deployments. When the list is empty, the request's own host is allowed, which
 * keeps the local/Caddy setup (everything same-origin) working unchanged.
 */

/** Splits the `ALLOWED_ORIGINS` env value into a list of patterns. */
export function parseAllowedOrigins(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** Whether `origin` matches an exact origin or a single `*` wildcard pattern. */
function matchesOrigin(origin: string, pattern: string): boolean {
  if (!pattern.includes("*")) {
    return origin === pattern;
  }

  const star = pattern.indexOf("*");
  const prefix = pattern.slice(0, star);
  const suffix = pattern.slice(star + 1);
  return origin.startsWith(prefix) && origin.endsWith(suffix);
}

/**
 * Whether a request origin may talk to the API. A missing origin (same-origin
 * requests, server-to-server, tools) is always allowed.
 */
export function isOriginAllowed(
  origin: string | undefined,
  host: string | undefined,
  allowedOrigins: readonly string[] | undefined,
): boolean {
  if (!origin) {
    return true;
  }

  const patterns =
    allowedOrigins && allowedOrigins.length > 0
      ? allowedOrigins
      : host
        ? [`http://${host}`, `https://${host}`]
        : [];

  if (patterns.length === 0) {
    return true;
  }

  return patterns.some((pattern) => matchesOrigin(origin, pattern));
}
