import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import type React from "react";
import { useGameConnection } from "#/lib/use-game-connection";
import { ClientInterface } from "#/components/client/ClientInterface";
import {
  INK,
  PAGE_BG,
  PINK,
  ROYAL,
  SUN,
  Sparkle,
  TOMATO,
  lilita,
  nunito,
} from "#/components/chop-chop/design";

export const Route = createFileRoute("/join")({ component: JoinScreen });

const CODE_LENGTH = 6;
const PLAYER_COLORS = [ROYAL, TOMATO, "#159A6B", PINK, SUN];

const label: React.CSSProperties = {
  font: nunito(900, 15),
  letterSpacing: ".14em",
};

const focusRing = (focused: boolean): React.CSSProperties => ({
  border: `4px solid ${focused ? ROYAL : INK}`,
  boxShadow: focused ? "0 0 0 4px #DCE6FF" : "none",
});

function JoinScreen() {
  const [nameInput, setNameInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeFocused, setCodeFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
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

  if (connection.started) return <ClientInterface connection={connection} />;

  const waiting =
    joined !== null &&
    ["Connecting...", "Connected", "Waiting for host"].includes(
      connection.status,
    );

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: PAGE_BG,
        color: INK,
        fontFamily: "Nunito, sans-serif",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          join();
        }}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 390,
          minHeight: "100dvh",
          padding: "32px 28px 36px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <Sparkle
          kind="star"
          color={SUN}
          size={28}
          style={{ position: "absolute", left: 40, top: 40 }}
        />
        <Sparkle
          kind="plus"
          color={PINK}
          size={20}
          style={{ position: "absolute", right: 44, top: 34 }}
        />

        <div
          style={{
            textAlign: "center",
            font: lilita(52, 1),
            color: SUN,
            WebkitTextStroke: `8px ${INK}`,
            paintOrder: "stroke fill",
            textShadow: `0 5px 0 ${INK}`,
            marginBottom: 12,
          }}
        >
          Chop Chop!
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={label}>ROOM CODE</span>
          <div style={{ position: "relative" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${CODE_LENGTH},1fr)`,
                gap: 8,
              }}
              aria-hidden
            >
              {Array.from({ length: CODE_LENGTH }, (_, i) => {
                const active =
                  codeFocused &&
                  i === Math.min(codeInput.length, CODE_LENGTH - 1);
                return (
                  <div
                    key={i}
                    style={{
                      height: 64,
                      background: "#fff",
                      borderRadius: 18,
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      font: lilita(38),
                      ...focusRing(active),
                    }}
                  >
                    {codeInput[i] ?? ""}
                  </div>
                );
              })}
            </div>
            <input
              autoCapitalize="characters"
              autoComplete="off"
              aria-label="Room code"
              disabled={waiting}
              maxLength={CODE_LENGTH}
              value={codeInput}
              onChange={(event) =>
                setCodeInput(
                  event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                )
              }
              onFocus={() => setCodeFocused(true)}
              onBlur={() => setCodeFocused(false)}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                opacity: 0,
                fontSize: 16,
                cursor: "text",
              }}
            />
          </div>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={label}>YOUR NAME</span>
          <input
            autoComplete="off"
            disabled={waiting}
            maxLength={20}
            placeholder="Chef name"
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            style={{
              height: 64,
              background: "#fff",
              borderRadius: 22,
              boxSizing: "border-box",
              padding: "0 20px",
              font: nunito(800, 26),
              color: INK,
              caretColor: ROYAL,
              outline: "none",
              ...focusRing(nameFocused),
            }}
          />
        </label>

        {joined && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={label}>
              IN THE KITCHEN · {connection.players.length}
            </span>
            <div
              style={{ display: "flex", flexWrap: "wrap", gap: 14, padding: 6 }}
            >
              {connection.players.map((player, i) => {
                const color = PLAYER_COLORS[i % PLAYER_COLORS.length];
                return (
                  <div
                    key={player.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#fff",
                      border: `4px solid ${INK}`,
                      borderRadius: 24,
                      padding: "4px 14px 4px 6px",
                      boxShadow: `0 0 0 5px ${color}`,
                      opacity: player.connected ? 1 : 0.45,
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: color,
                        border: `3px solid ${INK}`,
                        boxSizing: "border-box",
                      }}
                    />
                    <span style={{ font: lilita(24) }}>{player.name}</span>
                    {(player.id === connection.playerId ||
                      player.isHost ||
                      !player.connected) && (
                      <span style={{ font: nunito(800, 14) }}>
                        {player.id === connection.playerId
                          ? "you"
                          : player.isHost
                            ? "host"
                            : "offline"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {connection.message && (
          <div
            style={{
              background: "#FFE1DA",
              border: `4px solid ${TOMATO}`,
              borderRadius: 20,
              padding: "10px 16px",
              font: nunito(800, 16),
            }}
          >
            {connection.message}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {waiting ? (
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
            {connection.status === "Waiting for host"
              ? "Waiting for Start"
              : connection.status}
            <span style={{ display: "flex", gap: 5 }}>
              {[1, 0.6, 0.3].map((opacity) => (
                <span
                  key={opacity}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: SUN,
                    opacity,
                  }}
                />
              ))}
            </span>
          </div>
        ) : (
          <button
            type="submit"
            disabled={!canJoin}
            style={{
              position: "relative",
              height: 84,
              borderRadius: 42,
              background: SUN,
              border: `4px solid ${INK}`,
              boxSizing: "border-box",
              boxShadow:
                "inset 0 -8px 0 rgba(43,42,107,.16),0 0 0 6px #fff,0 10px 0 6px rgba(43,42,107,.16)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              font: lilita(46),
              color: INK,
              cursor: canJoin ? "pointer" : "not-allowed",
              opacity: canJoin ? 1 : 0.5,
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 32,
                top: 12,
                width: 44,
                height: 11,
                borderRadius: 6,
                background: "#fff",
                opacity: 0.7,
              }}
            />
            Join!
          </button>
        )}

        <div
          style={{
            alignSelf: "center",
            display: "flex",
            gap: 20,
            marginTop: 6,
          }}
        >
          <a href="/practice" style={{ font: nunito(800, 16), color: ROYAL }}>
            Try a practice round
          </a>
          <a href="/host" style={{ font: nunito(800, 16), color: ROYAL }}>
            Host a game instead
          </a>
        </div>
      </form>
    </div>
  );
}
