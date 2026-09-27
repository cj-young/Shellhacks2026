import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type React from "react";
import { createHostGame } from "#/lib/host-game";
import {
  ChopChopLogo,
  DOT,
  Food,
  INK,
  LEAF,
  PAGE_BG,
  PINK,
  ROYAL,
  SKY,
  SUN,
  Sparkle,
  lilita,
  nunito,
} from "#/components/chop-chop/design";

import { paper } from "#/components/chop-chop/paper";

export const Route = createFileRoute("/")({
  component: MainMenu,
  head: () => ({
    meta: [
      {
        title: "chopchop",
      },
    ],
  }),
});

const menuButton: React.CSSProperties = {
  ...paper(42, 0),
  position: "relative",
  width: "100%",
  height: 84,
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 14,
  font: lilita(40),
  color: INK,
  textDecoration: "none",
  cursor: "pointer",
};

const caption: React.CSSProperties = {
  font: nunito(800, 17),
  textAlign: "center",
};

function MainMenu() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const hostGame = async () => {
    setCreating(true);
    setError("");
    try {
      await createHostGame();
      await navigate({ to: "/host" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create a game");
      setCreating(false);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        overflow: "hidden",
        backgroundColor: PAGE_BG,
        backgroundImage: `radial-gradient(${DOT} 2.5px, transparent 3px)`,
        backgroundSize: "40px 40px",
        color: INK,
        fontFamily: "Nunito, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(28px, 5vh, 56px)",
        padding: "48px 24px",
        boxSizing: "border-box",
      }}
    >
      <Food
        kind="dumpling"
        size={110}
        rotate={-14}
        style={{ position: "absolute", left: "4%", top: "5%" }}
      />
      <Food
        kind="tomato"
        size={96}
        rotate={12}
        style={{ position: "absolute", right: "5%", top: "7%" }}
      />
      <Sparkle
        kind="star"
        color={SUN}
        size={48}
        rotate={10}
        style={{ position: "absolute", right: "14%", top: "26%" }}
      />
      <Sparkle
        kind="plus"
        color={PINK}
        size={30}
        style={{ position: "absolute", left: "9%", top: "38%" }}
      />
      <Sparkle
        kind="dot"
        color={SKY}
        size={20}
        style={{ position: "absolute", left: "32%", top: "6%" }}
      />
      <Sparkle
        kind="star"
        color={LEAF}
        size={36}
        style={{ position: "absolute", left: "12%", bottom: "14%" }}
      />
      <Sparkle
        kind="plus"
        color={SUN}
        size={28}
        style={{ position: "absolute", right: "8%", bottom: "20%" }}
      />
      <Sparkle
        kind="dot"
        color={PINK}
        size={18}
        style={{ position: "absolute", right: "30%", bottom: "6%" }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          fontSize: "clamp(64px, 11vw, 170px)",
        }}
      >
        <ChopChopLogo width="min(88vw, 620px)" />
        {/* <div
          style={{
            ...paper(40, 1, false),
            position: "relative",
            zIndex: 1,
            marginTop: "-0.28em",
            marginRight: "0",
            transform: "rotate(3deg)",
            background: ROYAL,
            padding: "0.23em 0.77em",
            boxShadow: "var(--paper-shadow)",
            fontFamily: "'Sniglet'",
            fontSize: "clamp(22px, 2.6vw, 44px)",
            color: "#fff",
            letterSpacing: ".06em",
            whiteSpace: "nowrap",
          }}
        >
          KITCHEN RELAY
        </div> */}
      </div>

      {/* <div
        style={{
          font: nunito(900, 38),
          fontSize: "clamp(22px, 3vw, 38px)",
          textAlign: "center",
        }}
      >
        Cook together. Pass it on.
      </div> */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "28px 40px",
          width: "100%",
          maxWidth: 780,
        }}
      >
        <div
          style={{
            flex: "1 1 300px",
            maxWidth: 360,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <button
            type="button"
            onClick={() => void hostGame()}
            disabled={creating}
            style={{
              ...menuButton,
              background: LEAF,
              opacity: creating ? 0.7 : 1,
              cursor: creating ? "wait" : "pointer",
            }}
          >
            <span
              style={{
                ...paper("50%", 2),
                width: 52,
                height: 52,
                background: SUN,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path
                  d="M7 4 L20 12 L7 20 Z"
                  fill={INK}
                  stroke={INK}
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {creating ? "Setting up…" : "Host game"}
          </button>
          <span style={caption}>Put the kitchen on the big screen</span>
        </div>

        <div
          style={{
            flex: "1 1 300px",
            maxWidth: 360,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <Link to="/join" style={{ ...menuButton, background: SUN }}>
            Join game
          </Link>
          <span style={caption}>Grab your phone and a room code</span>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "#FFE1DA",
            ...paper(20, 20),
            padding: "10px 18px",
            font: nunito(800, 16),
          }}
        >
          Couldn't open a kitchen: {error}
        </div>
      )}
    </div>
  );
}
