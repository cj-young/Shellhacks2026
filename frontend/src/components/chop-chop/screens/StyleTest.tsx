import React from "react";
import {
  P,
  PaperBadge,
  PaperBanner,
  PaperButton,
  PaperCard,
  PaperInput,
  PaperPill,
  PaperRoomCode,
  PaperScore,
  PaperTag,
  PaperTimer,
  nunito,
  sniglet,
  textOn,
} from "../paper";
import type { PaperColor } from "../paper";

const SWATCHES: { color: PaperColor; name: string }[] = [
  { color: "tomato", name: "Tomato" },
  { color: "carrot", name: "Carrot" },
  { color: "sun", name: "Sun" },
  { color: "leaf", name: "Leaf" },
  { color: "deepGreen", name: "Deep green" },
  { color: "teal", name: "Pea teal" },
  { color: "wood", name: "Wood" },
  { color: "card", name: "Card paper" },
  { color: "ink", name: "Espresso" },
];

const STATES = ["Default", "Hover", "Pressed", "Disabled", "Selected"];
const BUTTON_COLORS: PaperColor[] = ["sun", "leaf", "tomato", "teal"];

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        font: nunito(900, 16),
        letterSpacing: ".16em",
        marginBottom: 14,
        opacity: 0.75,
      }}
    >
      {children}
    </div>
  );
}

/** Dev-switcher sheet of every paper component and state, for sign-off. */
export function StyleTest() {
  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: P.bg,
        color: P.ink,
        fontFamily: "Nunito, sans-serif",
        padding: "40px 56px",
        boxSizing: "border-box",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "auto auto 1fr",
        gap: "34px 64px",
        overflow: "hidden",
      }}
    >
      <section>
        <Heading>PALETTE</Heading>
        <div style={{ display: "flex", gap: 12 }}>
          {SWATCHES.map((s, i) => (
            <PaperCard
              key={s.color}
              color={s.color}
              cutIndex={i}
              style={{
                width: 88,
                height: 110,
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
              }}
            >
              <span style={{ ...sniglet(17, 1.1) }}>{s.name}</span>
              <span style={{ font: nunito(800, 12) }}>{P[s.color]}</span>
            </PaperCard>
          ))}
        </div>
      </section>

      <section>
        <Heading>TYPE</Heading>
        <div style={{ ...sniglet(72, 1) }}>Chop Chop!</div>
        <div style={{ ...sniglet(40, 1.2), marginTop: 6 }}>
          Headings, buttons, timers, scores
        </div>
        <div style={{ font: nunito(800, 22), marginTop: 10 }}>
          Body text and captions stay in Nunito 700–900, in espresso brown.
        </div>
        <div style={{ font: nunito(700, 18), marginTop: 4, opacity: 0.8 }}>
          Grab 3 tomatoes, then chop them before the timer runs out.
        </div>
      </section>

      <section style={{ gridColumn: "1 / -1" }}>
        <Heading>BUTTONS</Heading>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `120px repeat(${STATES.length}, 1fr)`,
            alignItems: "center",
            rowGap: 20,
            columnGap: 24,
          }}
        >
          <span />
          {STATES.map((s) => (
            <span key={s} style={{ font: nunito(900, 16), opacity: 0.7 }}>
              {s}
            </span>
          ))}
          {BUTTON_COLORS.map((color, row) => (
            <React.Fragment key={color}>
              <span style={{ font: nunito(900, 18) }}>
                {SWATCHES.find((s) => s.color === color)?.name}
              </span>
              <PaperButton color={color} size="md" cutIndex={row}>
                Join!
              </PaperButton>
              <PaperButton
                color={color}
                size="md"
                cutIndex={row + 1}
                state="hover"
              >
                Join!
              </PaperButton>
              <PaperButton
                color={color}
                size="md"
                cutIndex={row + 2}
                state="pressed"
              >
                Join!
              </PaperButton>
              <PaperButton color={color} size="md" cutIndex={row} disabled>
                Join!
              </PaperButton>
              <PaperButton color={color} size="md" cutIndex={row + 1} selected>
                Join!
              </PaperButton>
            </React.Fragment>
          ))}
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        <div>
          <Heading>PILLS · BADGES · TAGS</Heading>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 18,
            }}
          >
            <PaperPill>
              <PaperBadge color="tomato" size={28}>
                {""}
              </PaperBadge>
              Mina
            </PaperPill>
            <PaperPill color="leaf" cutIndex={1}>
              4 chefs in
            </PaperPill>
            <PaperPill color="teal" cutIndex={2}>
              Taken by Jun
            </PaperPill>
            <PaperBadge color="tomato">3</PaperBadge>
            <PaperBadge color="sun" cutIndex={1}>
              ✓
            </PaperBadge>
            <PaperBadge color="deepGreen" cutIndex={2}>
              1
            </PaperBadge>
            <PaperTag color="leaf">KITCHEN RELAY</PaperTag>
            <PaperTag color="carrot" tilt={-3}>
              NEW!
            </PaperTag>
          </div>
        </div>

        <div>
          <Heading>INPUTS · DEFAULT · FOCUSED · DISABLED</Heading>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 20,
            }}
          >
            <PaperInput value="" placeholder="Chef name" />
            <PaperInput value="Mina" focused />
            <PaperInput value="Mina" disabled />
          </div>
        </div>

        <div>
          <Heading>BANNERS</Heading>
          <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
            <PaperBanner color="tomato">Time's up!</PaperBanner>
            <PaperBanner color="leaf" tilt={2} size={44}>
              Round clear
            </PaperBanner>
          </div>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        <div>
          <Heading>TIMER · SCORE · ROOM CODE</Heading>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 26,
            }}
          >
            <PaperTimer seconds={83} />
            <PaperTimer seconds={9} urgent />
            <PaperScore points={2400} />
            <PaperRoomCode code="YUMI" />
          </div>
        </div>

        <div>
          <Heading>CARDS</Heading>
          <div style={{ display: "flex", gap: 24 }}>
            <PaperCard cutIndex={0} style={{ width: 300 }}>
              <div style={{ ...sniglet(30, 1.1) }}>Tacos</div>
              <div style={{ font: nunito(800, 18), marginTop: 6 }}>
                Recipe 1 of 3 · chop, stir, plate
              </div>
            </PaperCard>
            <PaperCard
              color="sun"
              cutIndex={2}
              tilt={-2}
              style={{ width: 260 }}
            >
              <div style={{ ...sniglet(30, 1.1) }}>Your turn!</div>
              <div style={{ font: nunito(800, 18), marginTop: 6 }}>
                Tilted, standalone
              </div>
            </PaperCard>
            <PaperCard
              color="teal"
              cutIndex={4}
              style={{ width: 220, color: textOn("teal") }}
            >
              <div style={{ ...sniglet(30, 1.1) }}>Pantry</div>
              <div style={{ font: nunito(800, 18), marginTop: 6 }}>
                Dark fill
              </div>
            </PaperCard>
          </div>
        </div>
      </section>
    </div>
  );
}
