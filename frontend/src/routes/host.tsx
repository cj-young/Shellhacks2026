import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGameConnection } from "#/lib/use-game-connection";
import { createHostGame, loadStoredHostGame } from "#/lib/host-game";
import type { HostGame } from "#/lib/host-game";
import { HostInterface } from "#/components/host/HostInterface";
import { PAGE_BG } from "#/components/chop-chop/design";
import {
  HostLobbyNew,
  LOBBY_COLORS,
} from "#/components/chop-chop/screens/HostLobbyNew";

export const Route = createFileRoute("/host")({ component: HostScreen });

const CONNECTION_PROBLEMS = ["Connection failed", "Disconnected", "Error"];

function HostScreen() {
  const [game, setGame] = useState<HostGame | null>(null);
  const [setupError, setSetupError] = useState("");
  const [joinText, setJoinText] = useState<string | undefined>(undefined);
  const creating = useRef(false);
  const connection = useGameConnection(
    game ? { code: game.code, token: game.hostToken, name: game.name } : null,
  );

  useEffect(() => {
    setJoinText(`${window.location.host}/join`);

    const stored = loadStoredHostGame();
    if (stored) {
      setGame(stored);
      return;
    }
    // Guards against React StrictMode running this effect twice and creating two rooms.
    if (creating.current) return;
    creating.current = true;
    createHostGame()
      .then(setGame)
      .catch((error: unknown) => {
        setSetupError(
          error instanceof Error ? error.message : "Unable to create a game",
        );
      });
  }, []);

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
      color: LOBBY_COLORS[i % LOBBY_COLORS.length],
      connected: player.connected,
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
        canStart={connection.playerId !== null}
        onStart={startGame}
        notice={notice}
      />
    </div>
  );
}
