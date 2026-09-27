/** sessionStorage keys shared by the host and join flows. */

/** The host's persisted game ({ code, hostToken, name }). */
export const hostGameKey = "shellhacks.hostGame";

/** A player's reconnect token for a specific game. */
export const playerTokenKey = (code: string) =>
  `shellhacks.playerToken:${code}`;
