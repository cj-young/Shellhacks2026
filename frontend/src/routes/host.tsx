import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useGameConnection } from "#/lib/use-game-connection";
import { HostInterface } from "#/components/host/HostInterface";

type HostGame = { code: string; hostToken: string; name: string };

const STORAGE_KEY = "shellhacks.hostGame";

export const Route = createFileRoute("/host")({ component: HostScreen });

function loadStoredGame(): HostGame | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<HostGame>;
    if (
      typeof parsed.code !== "string" ||
      typeof parsed.hostToken !== "string"
    ) {
      return null;
    }

    const name =
      typeof parsed.name === "string" && parsed.name.trim()
        ? parsed.name
        : "Host";

    return { code: parsed.code, hostToken: parsed.hostToken, name };
  } catch {
    return null;
  }
}

function HostScreen() {
  const [game, setGame] = useState<HostGame | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [createError, setCreateError] = useState("");
  const connection = useGameConnection(
    game ? { code: game.code, token: game.hostToken, name: game.name } : null,
  );

  useEffect(() => {
    const stored = loadStoredGame();
    if (stored) {
      setGame(stored);
      setNameInput(stored.name);
    }
  }, []);

  const canCreate = nameInput.trim().length > 0;

  const createGame = useCallback(async () => {
    const name = nameInput.trim();
    if (!name) return;

    setCreateError("");

    try {
      const response = await fetch("/api/games", { method: "POST" });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);

      const created = (await response.json()) as {
        code: string;
        hostToken: string;
      };
      const hostGame: HostGame = { ...created, name };
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(hostGame));
      setGame(hostGame);
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Unable to create a game",
      );
    }
  }, [nameInput]);

  const startGame = useCallback(() => {
    setCreateError("");
    connection.socketRef.current?.emit("start_game");
  }, [connection.socketRef]);

  const errorMessage = createError || connection.message;

  if (connection.started) {
    return <HostInterface connection={connection}></HostInterface>;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <h1 className="text-2xl font-bold">Host a game</h1>

        <input
          autoComplete="off"
          className="w-full rounded border border-slate-700 bg-slate-900 px-4 py-2"
          maxLength={20}
          onChange={(event) => setNameInput(event.target.value)}
          placeholder="Your name"
          value={nameInput}
        />

        <button
          className="rounded border border-cyan-400 px-4 py-2 font-medium hover:bg-cyan-400/10 disabled:opacity-40"
          disabled={!canCreate}
          onClick={() => {
            void createGame();
          }}
          type="button"
        >
          {game ? "Create a new game" : "Create game"}
        </button>

        {game && (
          <>
            <div className="rounded border border-slate-700 p-4">
              <p className="text-sm text-slate-400">Game code</p>
              <p className="font-mono text-4xl tracking-widest">{game.code}</p>
              <button
                className="mt-2 text-sm text-cyan-400 underline"
                onClick={() => {
                  void navigator.clipboard.writeText(game.code);
                }}
                type="button"
              >
                Copy code
              </button>
            </div>

            <button
              className="rounded border border-slate-600 px-4 py-2 hover:bg-slate-800"
              onClick={startGame}
              type="button"
            >
              Start game
            </button>

            <div className="rounded border border-slate-700 p-4">
              <p className="text-sm text-slate-400">
                Players ({connection.players.length})
              </p>
              <ul className="mt-2 flex flex-col gap-1">
                {connection.players.length === 0 && (
                  <li className="text-slate-500">Waiting...</li>
                )}
                {connection.players.map((player) => (
                  <li
                    key={player.id}
                    className={player.connected ? undefined : "text-slate-500"}
                  >
                    {player.name}
                    {player.isHost ? " (host)" : ""}
                    {player.connected ? "" : " (disconnected)"}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <p className="text-sm text-slate-400">{connection.status}</p>
        {errorMessage && (
          <p className="text-sm text-amber-400">{errorMessage}</p>
        )}

        <a className="text-sm text-cyan-400 underline" href="/">
          Back to the game
        </a>
      </div>
    </div>
  );
}
