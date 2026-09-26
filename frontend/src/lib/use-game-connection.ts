import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { MakeEmptyState } from "./types";
import type { GameState, PlayerSummary } from "./types";

export type Player = PlayerSummary;
export type GameAuth = { code: string; token?: string; name?: string };

type JoinedPayload = {
  playerId: string;
  reconnectToken: string;
  players: PlayerSummary[];
};

export type GameConnection = {
  socketRef: RefObject<Socket | null>;
  players: PlayerSummary[];
  playerId: string | null;
  status: string;
  message: string;
  started: boolean;
  state: GameState;
};

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
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [status, setStatus] = useState("Not connected");
  const [message, setMessage] = useState("");
  const [started, setStarted] = useState(false);
  const [state, setState] = useState<GameState>(MakeEmptyState());

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

    const reconnectToken = readStoredToken(code);
    const socket = io({
      path: "/api/socket.io/",
      auth: { code, token, name, reconnectToken },
    });
    socketRef.current = socket;

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

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [code, name, token]);

  return { socketRef, players, playerId, status, message, started, state };
}
