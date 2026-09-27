import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useGameConnection } from "#/lib/use-game-connection";
import { ClientInterface } from "#/components/client/ClientInterface";

export const Route = createFileRoute("/join")({
  component: JoinScreen,
  validateSearch: (search: Record<string, unknown>) => {
    const raw = Array.isArray(search.code) ? search.code[0] : search.code;
    if (typeof raw !== "string") return {};

    const code = raw
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
    return code ? { code } : {};
  },
});

function JoinScreen() {
  const { code: codeParam } = Route.useSearch();
  const [nameInput, setNameInput] = useState("");
  const [codeInput, setCodeInput] = useState(() => codeParam ?? "");
  const [joined, setJoined] = useState<{ code: string; name: string } | null>(
    null,
  );
  const connection = useGameConnection(joined);

  const canJoin = nameInput.trim().length > 0 && codeInput.trim().length > 0;

  const join = useCallback(() => {
    const name = nameInput.trim();
    const code = codeInput.trim().toUpperCase();
    if (!name || !code) return;
    setJoined({ code, name });
  }, [codeInput, nameInput]);

  if (connection.started)
    return <ClientInterface connection={connection}></ClientInterface>;

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <h1 className="text-2xl font-bold">Join a game</h1>

        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            join();
          }}
        >
          <input
            autoComplete="off"
            className="w-full rounded border border-slate-700 bg-slate-900 px-4 py-2"
            maxLength={20}
            onChange={(event) => setNameInput(event.target.value)}
            placeholder="Your name"
            value={nameInput}
          />
          <div className="flex gap-2">
            <input
              autoCapitalize="characters"
              autoComplete="off"
              className="w-full rounded border border-slate-700 bg-slate-900 px-4 py-2 font-mono text-lg tracking-widest uppercase"
              maxLength={6}
              onChange={(event) =>
                setCodeInput(event.target.value.toUpperCase())
              }
              placeholder="ABC123"
              value={codeInput}
            />
            <button
              className="rounded border border-cyan-400 px-4 py-2 font-medium hover:bg-cyan-400/10 disabled:opacity-40"
              disabled={!canJoin}
              type="submit"
            >
              Join
            </button>
          </div>
        </form>

        {joined && (
          <div className="rounded border border-slate-700 p-4">
            <p className="text-sm text-slate-400">
              Players ({connection.players.length})
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {connection.players.map((player) => (
                <li
                  key={player.id}
                  className={player.connected ? undefined : "text-slate-500"}
                >
                  {player.name}
                  {player.id === connection.playerId ? " (you)" : ""}
                  {player.isHost ? " (host)" : ""}
                  {player.connected ? "" : " (disconnected)"}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-sm text-slate-400">{connection.status}</p>
        {connection.message && (
          <p className="text-sm text-amber-400">{connection.message}</p>
        )}

        {connection.started && (
          <a
            className="rounded border border-cyan-400 px-4 py-2 text-center font-medium hover:bg-cyan-400/10"
            href="/"
          >
            Enter the game
          </a>
        )}

        <a className="text-sm text-cyan-400 underline" href="/host">
          Host a game instead
        </a>
      </div>
    </div>
  );
}
