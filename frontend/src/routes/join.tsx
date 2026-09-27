import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import type React from "react";
import { useGameConnection } from "#/lib/use-game-connection";
import { ClientInterface } from "#/components/client/ClientInterface";
import { WaitingRoom } from "#/components/client/WaitingRoom";
import {
  ChopChopLogo,
  INK,
  PAGE_BG,
  PINK,
  ROYAL,
  SUN,
  Sparkle,
  lilita,
  nunito,
} from "#/components/chop-chop/design";

import { paper } from "#/components/chop-chop/paper";

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
  head: () => ({
    meta: [
      {
        title: "chopchop | join",
      },
    ],
  }),
});

const CODE_LENGTH = 6;

const label: React.CSSProperties = {
  font: nunito(900, 15),
  letterSpacing: ".14em",
};

// Pressed-in paper field; a sun glow shows focus. Spread after borderRadius.
const focusRing = (focused: boolean): React.CSSProperties => ({
  border: "none",
  boxShadow: focused
    ? `0 0 0 5px ${SUN}, var(--paper-shadow)`
    : "inset 1px 3px 0 rgba(122,78,30,.12), var(--paper-shadow-pressed)",
});

function JoinScreen() {
  const { code: codeParam } = Route.useSearch();
  const [nameInput, setNameInput] = useState("");
  const [codeInput, setCodeInput] = useState(() => codeParam ?? "");
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
  // Joined: go to the lobby waiting room to pick a chef.
  if (joined && connection.playerId) {
    return <WaitingRoom connection={connection} />;
  }

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

        <ChopChopLogo
          width={240}
          style={{ alignSelf: "center", marginBottom: 4 }}
        />

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

        {connection.message && (
          <div
            style={{
              background: "#FFE1DA",
              ...paper(20, 21),
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
              ...paper(42, 1),
              position: "relative",
              height: 84,
              background: SUN,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              font: lilita(46),
              color: INK,
              cursor: canJoin ? "pointer" : "not-allowed",
              opacity: canJoin ? 1 : 0.5,
            }}
          >
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
