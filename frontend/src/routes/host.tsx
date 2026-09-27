import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGameConnection } from "#/lib/use-game-connection";
import {
  clearHostGame,
  createHostGame,
  fetchGameStatus,
  loadStoredHostGame,
} from "#/lib/host-game";
import type { HostGame } from "#/lib/host-game";
import { HostInterface } from "#/components/host/HostInterface";
import { PAGE_BG } from "#/components/chop-chop/design";
import {
  HostLobbyNew,
  lobbyColor,
} from "#/components/chop-chop/screens/HostLobbyNew";

export const Route = createFileRoute("/host")({
  component: HostScreen,
  head: () => ({
    meta: [
      {
        title: "chopchop | host",
      },
    ],
  }),
});

const CONNECTION_PROBLEMS = ["Connection failed", "Disconnected", "Error"];

function HostScreen() {
  const [game, setGame] = useState<HostGame | null>(null);
  const [setupError, setSetupError] = useState("");
  const [joinText, setJoinText] = useState<string | undefined>(undefined);
  const [joinUrl, setJoinUrl] = useState<string | undefined>(undefined);
  const creating = useRef(false);
  const connection = useGameConnection(
    game ? { code: game.code, token: game.hostToken, name: game.name } : null,
  );

  useEffect(() => {
    setJoinText(`${window.location.host}/join`);

    // Guards against React StrictMode running this effect twice and creating two rooms.
    const create = () => {
      if (creating.current) return;
      creating.current = true;
      createHostGame()
        .then(setGame)
        .catch((error: unknown) => {
          setSetupError(
            error instanceof Error ? error.message : "Unable to create a game",
          );
        });
    };

    const start = async () => {
      const stored = loadStoredHostGame();
      if (!stored) {
        create();
        return;
      }

      // Reuse a persisted game only while it's still a lobby or in progress. A
      // finished game, or one the server no longer has, must be replaced.
      const status = await fetchGameStatus(stored.code);
      if (status === "lobby" || status === "active" || status === undefined) {
        setGame(stored);
        return;
      }

      clearHostGame(stored.code);
      create();
    };

    void start();
  }, []);

  // The round is over, so the next load should start a fresh room.
  useEffect(() => {
    if (connection.results && game) {
      clearHostGame(game.code);
    }
  }, [connection.results, game]);

  // The QR code opens the join page with this room's code filled in.
  useEffect(() => {
    setJoinUrl(
      game
        ? new URL(`/join?code=${game.code}`, window.location.origin).toString()
        : undefined,
    );
  }, [game]);

  const startGame = useCallback(() => {
    connection.socketRef.current?.emit("start_game");
  }, [connection.socketRef]);

  if (connection.started) {
    return <HostInterface connection={connection} />;
  }

  const players = connection.players
    .filter((player) => !player.isHost)
    .map((player, i) => ({
      id: player.id,
      name: player.name,
      color: lobbyColor(player.character, i),
      connected: player.connected,
      character: player.character,
    }));

  const notice =
    setupError ||
    connection.message ||
    (CONNECTION_PROBLEMS.includes(connection.status)
      ? connection.status
      : undefined);

  return (
    <div style={{ width: "100vw", height: "100dvh", background: PAGE_BG }}>
      <HostLobbyNew
        roomCode={game?.code ?? "······"}
        players={players}
        joinText={joinText}
        joinUrl={joinUrl}
        canStart={connection.playerId !== null}
        onStart={startGame}
        notice={notice}
      />
    </div>
  );
}
