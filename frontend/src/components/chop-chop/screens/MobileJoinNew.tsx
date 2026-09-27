import { useState } from "react";
import {
  ChopChopLogo,
  ChefPlaceholder,
  DOT,
  INK,
  LEAF,
  PAGE_BG,
  PINK,
  PhoneFrame,
  ROYAL,
  SUN,
  Sparkle,
  lilita,
  nunito,
} from "../design";

import { paper } from "#/components/chop-chop/paper";
const ROOM_CODE = "YUMI";
const CHEFS = [
  {
    id: "mochi",
    name: "Mochi",
    who: "Bunny · chef toque",
    color: ROYAL,
    takenBy: null,
  },
  {
    id: "bori",
    name: "Bori",
    who: "Bear · bandana",
    color: "#EF4128",
    takenBy: "Jun",
  },
  {
    id: "tofu",
    name: "Tofu",
    who: "Cat · beanie",
    color: "#0F7F3F",
    takenBy: null,
  },
  {
    id: "dudu",
    name: "Dudu",
    who: "Puppy · beret",
    color: PINK,
    takenBy: null,
  },
  {
    id: "sunny",
    name: "Sunny",
    who: "Kid · earmuffs",
    color: SUN,
    takenBy: null,
  },
];

const label = { font: nunito(900, 15), letterSpacing: ".14em" };

export function MobileJoinNew() {
  const [name, setName] = useState("Mina");
  const [selectedId, setSelectedId] = useState("mochi");
  const selected = CHEFS.find((c) => c.id === selectedId) ?? CHEFS[0];
  const takenChefs = CHEFS.filter((c) => c.takenBy);

  return (
    <PhoneFrame background={{ background: PAGE_BG }}>
      <Sparkle
        kind="star"
        color={SUN}
        size={28}
        style={{ position: "absolute", left: 40, top: 74 }}
      />
      <Sparkle
        kind="plus"
        color={PINK}
        size={20}
        style={{ position: "absolute", right: 44, top: 68 }}
      />

      <ChopChopLogo
        width={180}
        style={{
          position: "absolute",
          top: 50,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 150,
          left: 28,
          right: 28,
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={label}>ROOM CODE</span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 12,
            }}
          >
            {ROOM_CODE.split("").map((letter, i) => (
              <div
                key={i}
                style={{
                  ...paper(20, 0),
                  height: 76,
                  background: "#fff",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  font: lilita(46),
                }}
              >
                {letter}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={label}>YOUR NAME</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            style={{
              height: 64,
              background: "#fff",
              ...paper(22, 26),
              boxSizing: "border-box",
              padding: "0 20px",
              font: nunito(800, 26),
              color: INK,
              caretColor: ROYAL,
              boxShadow: "0 0 0 4px #FFE7A0",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={label}>PICK YOUR CHEF</span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              height: 150,
            }}
          >
            <ChefPlaceholder color={selected.color} size={120} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ font: lilita(34) }}>{selected.name}</span>
              <span style={{ font: nunito(800, 17) }}>{selected.who}</span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5,1fr)",
              gap: 8,
            }}
          >
            {CHEFS.map((chef) => {
              const isSelected = chef.id === selectedId;
              const isTaken = chef.takenBy !== null;
              return (
                <button
                  key={chef.id}
                  type="button"
                  disabled={isTaken}
                  onClick={() => setSelectedId(chef.id)}
                  style={{
                    ...paper("50%", CHEFS.indexOf(chef)),
                    position: "relative",
                    height: 62,
                    aspectRatio: "1",
                    padding: 0,
                    boxSizing: "border-box",
                    background: isSelected ? "#FFE7A0" : isTaken ? DOT : "#fff",
                    ...(isSelected && {
                      boxShadow: `0 0 0 4px ${PAGE_BG}, 0 0 0 7px ${SUN}, var(--paper-shadow)`,
                    }),
                    opacity: isTaken ? 0.45 : 1,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    overflow: "visible",
                    cursor: isTaken ? "not-allowed" : "pointer",
                  }}
                >
                  <ChefPlaceholder color={chef.color} size={54} bust />
                  {isSelected && (
                    <span
                      style={{
                        ...paper("50%", 1),
                        position: "absolute",
                        right: -6,
                        top: -8,
                        width: 24,
                        height: 24,
                        background: LEAF,
                        boxSizing: "border-box",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12">
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
          {takenChefs.map((c) => (
            <span key={c.id} style={{ font: nunito(800, 14), paddingLeft: 72 }}>
              Taken by {c.takenBy}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          ...paper(42, 2),
          position: "absolute",
          left: 28,
          right: 28,
          bottom: 36,
          height: 84,
          background: SUN,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          font: lilita(46),
          cursor: "pointer",
        }}
      >
        Join!
      </div>
    </PhoneFrame>
  );
}
