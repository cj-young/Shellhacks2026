import { useEffect, useState } from "react";
import type { GameConnection } from "#/lib/use-game-connection";
import type { PlayerSummary } from "#/lib/types";
import { CHARACTERS, characterImage } from "#/data/characters";
import {
  ChopChopLogo,
  INK,
  LEAF,
  PAGE_BG,
  PINK,
  CARD_BG,
  SUN,
  Sparkle,
  lilita,
  nunito,
} from "#/components/chop-chop/design";

import { paper } from "#/components/chop-chop/paper";
/** Cycles 1–3 dots for "waiting" text. */
function useDots() {
  const [count, setCount] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setCount((c) => (c % 3) + 1), 500);
    return () => clearInterval(id);
  }, []);
  return ".".repeat(count);
}

/** Phone lobby after joining: pick a chef, then wait for the host to start. */
export function WaitingRoom({ connection }: { connection: GameConnection }) {
  const [pending, setPending] = useState<string | null>(null);
  const me = connection.players.find((p) => p.id === connection.playerId);

  // Clear the "picking…" state once the server confirms (or rejects) the choice.
  useEffect(() => {
    setPending(null);
  }, [me?.character, connection.message]);

  return (
    <WaitingRoomScreen
      players={connection.players}
      myId={connection.playerId}
      pending={pending}
      notice={me?.character ? undefined : connection.message || undefined}
      onPick={(character) => {
        setPending(character);
        connection.socketRef.current?.emit("select_character", character);
      }}
    />
  );
}

export function WaitingRoomScreen({
  players,
  myId,
  pending = null,
  notice,
  onPick,
  height = "100dvh",
}: {
  /** Screen height; the dev switcher passes a fixed phone height. */
  height?: string | number;
  players: PlayerSummary[];
  myId: string | null;
  pending?: string | null;
  notice?: string;
  onPick?: (character: string) => void;
}) {
  const dots = useDots();
  const me = players.find((p) => p.id === myId);
  const mine = me?.character ?? null;

  return (
    <div
      style={{
        minHeight: height,
        background: PAGE_BG,
        color: INK,
        fontFamily: "Nunito, sans-serif",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 430,
          minHeight: height,
          padding: "28px 22px 32px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <Sparkle
          kind="star"
          color={SUN}
          size={26}
          style={{ position: "absolute", left: 30, top: 30 }}
        />
        <Sparkle
          kind="plus"
          color={PINK}
          size={18}
          style={{ position: "absolute", right: 34, top: 26 }}
        />

        <ChopChopLogo width={190} style={{ alignSelf: "center" }} />

        <div style={{ textAlign: "center" }}>
          <div style={{ font: lilita(30, 1.1) }}>
            Waiting for game to start
            <span
              style={{
                display: "inline-block",
                width: "1.2em",
                textAlign: "left",
              }}
            >
              {dots}
            </span>
          </div>
          {me && (
            <div style={{ font: nunito(800, 16), marginTop: 4 }}>
              You're in as <b>{me.name}</b>
            </div>
          )}
        </div>

        <span
          style={{
            font: nunito(900, 15),
            letterSpacing: ".14em",
            textAlign: "center",
          }}
        >
          {mine ? "YOUR CHEF" : "PICK YOUR CHEF"}
        </span>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
          }}
        >
          {CHARACTERS.map((character) => {
            const owner = players.find(
              (p) => p.character === character.id && p.id !== myId,
            );
            const selected = mine === character.id;
            const isPending = pending === character.id;
            const disabled = Boolean(owner) || selected || !onPick;
            return (
              <button
                key={character.id}
                type="button"
                disabled={disabled}
                onClick={() => onPick?.(character.id)}
                aria-pressed={selected}
                style={{
                  ...paper(26, CHARACTERS.indexOf(character)),
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  padding: "12px 8px 10px",
                  background: selected ? "#FFE7A0" : "#fff",
                  ...(selected && {
                    boxShadow: `0 0 0 5px ${CARD_BG}, 0 0 0 9px ${SUN}, var(--paper-shadow)`,
                  }),
                  opacity: owner ? 0.45 : isPending ? 0.7 : 1,
                  cursor: disabled ? "default" : "pointer",
                  color: INK,
                  font: "inherit",
                }}
              >
                <img
                  src={characterImage(character.id)}
                  alt={character.name}
                  draggable={false}
                  style={{
                    width: "100%",
                    height: 130,
                    objectFit: "contain",
                    filter: owner ? "grayscale(.6)" : undefined,
                  }}
                />
                <span style={{ font: lilita(24, 1) }}>{character.name}</span>
                <span style={{ font: nunito(800, 13), minHeight: 17 }}>
                  {owner
                    ? `Taken by ${owner.name}`
                    : isPending
                      ? "Picking…"
                      : ""}
                </span>
                {selected && (
                  <span
                    style={{
                      ...paper("50%", 0),
                      position: "absolute",
                      right: -8,
                      top: -8,
                      width: 34,
                      height: 34,
                      background: LEAF,
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 12 12">
                      <path
                        d="M2 6 L5 9 L10 3"
                        stroke={INK}
                        strokeWidth="2.4"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {notice && (
          <div
            style={{
              background: "#FFE1DA",
              ...paper(20, 23),
              padding: "10px 16px",
              font: nunito(800, 16),
              textAlign: "center",
            }}
          >
            {notice}
          </div>
        )}

        <div style={{ flex: 1 }} />

        <div
          style={{
            alignSelf: "center",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: INK,
            color: "#fff",
            borderRadius: 26,
            padding: "10px 22px",
            font: nunito(800, 18),
            whiteSpace: "nowrap",
          }}
        >
          {mine ? "Waiting for Start" : "Pick a chef to get ready"}
          <span style={{ display: "flex", gap: 5 }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: SUN,
                  opacity: i < dots.length ? 1 : 0.3,
                }}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

const PREVIEW_PLAYERS = [
  { id: "me", name: "Mina", character: null },
  { id: "jun", name: "Jun", character: "cat" },
  { id: "ari", name: "Ari", character: null },
].map((p) => ({
  ...p,
  isHost: false,
  joinedAt: 0,
  connected: true,
  cart: {},
  inventory: {},
  recipeIndex: 0,
  recipeStageIndex: 0,
  score: 0,
})) as PlayerSummary[];

/** Dev-switcher previews. */
export function WaitingRoomPickPreview() {
  return (
    <WaitingRoomScreen
      height={864}
      players={PREVIEW_PLAYERS}
      myId="me"
      onPick={() => {}}
    />
  );
}
export function WaitingRoomPickedPreview() {
  return (
    <WaitingRoomScreen
      height={864}
      players={PREVIEW_PLAYERS.map((p) =>
        p.id === "me" ? { ...p, character: "bear" } : p,
      )}
      myId="me"
      onPick={() => {}}
    />
  );
}
