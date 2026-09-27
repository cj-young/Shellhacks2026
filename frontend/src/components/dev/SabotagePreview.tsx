import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { StoreScreen } from "#/components/chop-chop/screens/RacePhoneScreens";
import {
  SabotageControls,
  SabotageEffects,
} from "#/components/sabotage/SabotageUI";
import definitions from "#/data/sabotages.json";
import ingredients from "#/data/ingredients.json";
import { iconIdFor } from "#/components/client/Store";
import { useSabotages } from "#/lib/use-sabotages";
import type {
  SabotageAppliedPayload,
  SabotageDefinition,
  UseSabotagePayload,
} from "#/lib/sabotages";
import type { PlayerSummary } from "#/lib/types";
import type { GameConnection } from "#/lib/use-game-connection";

const makePlayer = (id: string, name: string): PlayerSummary => ({
  id,
  name,
  isHost: false,
  connected: true,
  joinedAt: 0,
  character: "cat",
  cart: {},
  inventory: { 5: 3 },
  interfaceState: "store",
  recipeIndex: 0,
  recipeStageIndex: 0,
  score: 0,
  stageDeadlineAt: null,
});

/** A local Socket.IO event fixture: no connection or backend changes required. */
export function SabotagePreview() {
  const [players, setPlayers] = useState(() => [
    makePlayer("preview-you", "You"),
    makePlayer("preview-jun", "Jun"),
  ]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [room] = useState(() => `preview-${Date.now()}`);
  const [failNext, setFailNext] = useState(false);
  const fail = useRef(false);
  const [host, setHost] = useState(false);
  const [cart, setCart] = useState<string[]>([]);
  const [lastCommand, setLastCommand] = useState("No commands sent yet.");
  const lastEvent = useRef<SabotageAppliedPayload | null>(null);
  const sabotages = useSabotages({
    socket,
    room,
    playerId: "preview-you",
    players,
    ended: false,
  });

  function broadcast(payload: SabotageAppliedPayload, targetSocket = socket) {
    lastEvent.current = payload;
    targetSocket
      ?.listeners("sabotage_applied")
      .forEach((listener) => listener(payload));
  }

  function eventFor(
    definitionId: string,
    sourcePlayerId: string,
    targetPlayerId?: string,
  ): SabotageAppliedPayload {
    const definition = definitions.find(
      (entry) => entry.id === definitionId,
    )! as SabotageDefinition;
    const now = Date.now();
    return {
      id: crypto.randomUUID(),
      definition,
      sourcePlayerId,
      targetPlayerId:
        definition.targetScope === "all"
          ? null
          : (targetPlayerId ?? "preview-you"),
      appliedAt: now,
      serverNow: now,
      expiresAt: definition.durationMs ? now + definition.durationMs : null,
      ingredientId: ["steal", "trash"].includes(definitionId) ? 5 : null,
    };
  }

  useEffect(() => {
    // Only this dev fixture replaces outgoing emits. Production uses the real socket.
    const fixture = io({ autoConnect: false, forceNew: true });
    fixture.connected = true;
    fixture.emit = (event, ...args) => {
      if (event !== "use_sabotage") return fixture;
      const payload = args[0] as UseSabotagePayload;
      setLastCommand(`${event} ${JSON.stringify(payload)}`);
      queueMicrotask(() => {
        if (fail.current) {
          fail.current = false;
          setFailNext(false);
          fixture
            .listeners("game_error")
            .forEach((listener) =>
              listener({
                code: "INVALID_TARGET",
                message:
                  "Preview rejection: choose a different target. Credit kept.",
              }),
            );
          return;
        }
        broadcast(
          eventFor(payload.definitionId, "preview-you", payload.targetPlayerId),
          fixture,
        );
      });
      return fixture;
    };
    socketRef.current = fixture;
    setSocket(fixture);
    return () => {
      fixture.connected = false;
      fixture.removeAllListeners();
      socketRef.current = null;
    };
  }, []);

  const connection: GameConnection = {
    socketRef,
    sabotages,
    players,
    playerId: "preview-you",
    status: "Preview",
    message: "",
    started: true,
    state: { recipeOrder: [], players },
    roundEndsAt: null,
    results: null,
  };
  const shelf = ingredients
    .slice(0, 9)
    .map((ingredient) => ({ kind: iconIdFor(ingredient) }));

  return (
    <div
      style={{
        width: 1120,
        height: 760,
        display: "flex",
        gap: 32,
        padding: 24,
        color: "#3d2817",
        fontFamily: "Nunito, sans-serif",
      }}
    >
      <div style={{ width: 500, paddingTop: 48 }}>
        <h1>Sabotage playground</h1>
        <p>
          Uses the real frontend event listeners with local sample broadcasts.
        </p>
        <button
          type="button"
          onClick={() =>
            setPlayers((current) =>
              current.map((player) =>
                player.id === "preview-you"
                  ? { ...player, recipeIndex: player.recipeIndex + 1 }
                  : player,
              ),
            )
          }
        >
          Complete recipe (+1 credit)
        </button>
        <p>Saved credits: {sabotages.credits}</p>
        <p>Receive a sabotage from Jun:</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {definitions.map((definition) => (
            <button
              type="button"
              key={definition.id}
              onClick={() => broadcast(eventFor(definition.id, "preview-jun"))}
            >
              {definition.name}
            </button>
          ))}
        </div>
        <p>
          <button
            type="button"
            onClick={() => {
              if (lastEvent.current) broadcast(lastEvent.current);
            }}
          >
            Replay last event (duplicate)
          </button>
        </p>
        <p>
          <label>
            <input
              type="checkbox"
              checked={failNext}
              onChange={(event) => {
                fail.current = event.target.checked;
                setFailNext(event.target.checked);
              }}
            />{" "}
            Reject next request
          </label>
        </p>
        <p>
          <label>
            <input
              type="checkbox"
              checked={host}
              onChange={(event) => setHost(event.target.checked)}
            />{" "}
            Preview host announcements
          </label>
        </p>
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {lastCommand}
        </pre>
        <p>
          Store items and the cart become silhouettes during blackout. Freeze
          disables store interaction. The production kitchen also pauses
          gestures.
        </p>
      </div>
      <div
        style={{
          position: "relative",
          width: 410,
          height: 710,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            transform: "scale(.8)",
            transformOrigin: "top left",
            width: 410,
            height: 864,
          }}
          inert={sabotages.frozenMs > 0}
        >
          <StoreScreen
            score={0}
            progress={0}
            disabled={sabotages.frozenMs > 0}
            blackout={sabotages.blackoutMs > 0}
            aisleName="PRODUCE"
            aisleCount={1}
            aisleIndex={0}
            shelf={shelf}
            basket={cart}
            onTake={(slot) =>
              setCart((current) => [...current, shelf[slot].kind])
            }
            onLeave={() => setCart([])}
          />
        </div>
      </div>
      <SabotageControls connection={connection} />
      <SabotageEffects connection={connection} host={host} />
    </div>
  );
}
