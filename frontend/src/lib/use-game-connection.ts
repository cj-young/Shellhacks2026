import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { SOCKET_PATH, SOCKET_URL } from "./api";
import { MakeEmptyState } from "./types";
import type { GameState, PlayerSummary } from "./types";

import { useSabotages } from "./use-sabotages";

export type Player = PlayerSummary;
export type GameAuth = { code: string; token?: string; name?: string };

type JoinedPayload = {
  playerId: string;
  reconnectToken: string;
  players: PlayerSummary[];
};

export type GameConnection = {
  socketRef: RefObject<Socket | null>;
  sabotages: ReturnType<typeof useSabotages>;
  players: PlayerSummary[];
  playerId: string | null;
  status: string;
  message: string;
  started: boolean;
  state: GameState;
  /** When the round ends, in this device's clock (from `timer_sync`); null before it starts. */
  roundEndsAt: number | null;
  /** Final results once the server ends the game (`game_ended`); null while playing. */
  results: PlayerResult[] | null;
};

export type PlayerResult = { playerId: string; name: string; score: number };

const tokenKey = (code: string) => `shellhacks.playerToken:${code}`;

function readStoredToken(code: string): string | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    return window.sessionStorage.getItem(tokenKey(code)) ?? undefined;
  } catch {
    return undefined;
  }
}

function storeToken(code: string, reconnectToken: string): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(tokenKey(code), reconnectToken);
  } catch {
    // Ignore storage failures (private mode, quota, etc.).
  }
}

export function useGameConnection(auth: GameAuth | null): GameConnection {
  const socketRef = useRef<Socket | null>(null);
  const [activeSocket, setActiveSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [status, setStatus] = useState("Not connected");
  const [message, setMessage] = useState("");
  const [started, setStarted] = useState(false);
  const [state, setState] = useState<GameState>(MakeEmptyState());
  const [roundEndsAt, setRoundEndsAt] = useState<number | null>(null);
  const [results, setResults] = useState<PlayerResult[] | null>(null);

  const code = auth?.code;
  const token = auth?.token;
  const name = auth?.name;

  useEffect(() => {
    if (!code) {
      setPlayers([]);
      setPlayerId(null);
      setStatus("Not connected");
      setMessage("");
      setStarted(false);
      setState(MakeEmptyState());
      return;
    }

    setStatus("Connecting...");
    setMessage("");
    setStarted(false);
    setState(MakeEmptyState());
    setRoundEndsAt(null);
    setResults(null);

    const reconnectToken = readStoredToken(code);
    const socket = io(SOCKET_URL || undefined, {
      path: SOCKET_PATH,
      auth: { code, token, name, reconnectToken },
    });
    socketRef.current = socket;
    setActiveSocket(socket);

    socket.on("connect", () => setStatus("Connected"));
    socket.on("connect_error", () => setStatus("Connection failed"));
    socket.on("disconnect", () => setStatus("Disconnected"));
    socket.on("joined", (payload: JoinedPayload) => {
      storeToken(code, payload.reconnectToken);
      setPlayers(payload.players);
      setPlayerId(payload.playerId);
      setStatus("Waiting for host");
    });
    socket.on("player_joined", (player: PlayerSummary) => {
      setPlayers((current) => [
        ...current.filter((entry) => entry.id !== player.id),
        player,
      ]);
    });
    socket.on(
      "player_disconnected",
      ({ playerId: leftId }: { playerId: string }) => {
        setPlayers((current) =>
          current.map((entry) =>
            entry.id === leftId ? { ...entry, connected: false } : entry,
          ),
        );
      },
    );
    socket.on("player_updated", (player: PlayerSummary) => {
      const replace = (list: PlayerSummary[]) =>
        list.map((entry) => (entry.id === player.id ? player : entry));
      setPlayers(replace);
      setState((current) => ({
        ...current,
        players: replace(current.players),
      }));
    });
    socket.on("game_started", () => {
      setStarted(true);
      setStatus("Game started");
    });
    socket.on(
      "game_error",
      ({ message: errorMessage }: { message: string }) => {
        setMessage(errorMessage);
        setStatus("Error");
      },
    );
    socket.on("update_state", (gameState: GameState) => {
      setState(gameState);
      console.log(gameState);
    });
    socket.on(
      "timer_sync",
      ({
        roundEndsAt: endsAt,
        serverNow,
      }: {
        roundEndsAt: number;
        serverNow: number;
      }) => {
        // Convert to this device's clock so small clock differences don't skew the countdown.
        setRoundEndsAt(endsAt - serverNow + Date.now());
      },
    );
    socket.on(
      "game_ended",
      ({ results: final }: { results: PlayerResult[] }) => {
        setResults(final);
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setActiveSocket(null);
    };
  }, [code, name, token]);

  const sabotages = useSabotages({
    socket: activeSocket,
    room: code,
    playerId,
    players: state.players,
    activeSabotages: state.activeSabotages,
    serverNow: state.serverNow,
    ended: results !== null,
  });

  return {
    sabotages,
    socketRef,
    players,
    playerId,
    status,
    message,
    started,
    state,
    roundEndsAt,
    results,
  };
}
