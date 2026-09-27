import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { VeggieBackground } from "../VeggieBackground";
import type React from "react";
import { PLATE_IMAGE, characterImage, getCharacter } from "#/data/characters";
import {
  ChopChopLogo,
  DOT,
  INK,
  LEAF,
  NamePill,
  PINK,
  ROYAL,
  SKY,
  SUN,
  lilita,
  nunito,
} from "../design";

import { paper } from "#/components/chop-chop/paper";
export type LobbyPlayer = {
  id: string;
  name: string;
  color: string;
  connected?: boolean;
  /** Picked chef id, or null/undefined while the player is still choosing. */
  character?: string | null;
};

/** Player colors in join order, from the design's cast. */
export const LOBBY_COLORS = [ROYAL, "#EF4128", "#0F7F3F", PINK, SUN];

/** A player's color: their chef's color once picked, otherwise by join order. */
export const lobbyColor = (
  character: string | null | undefined,
  index: number,
) =>
  getCharacter(character)?.color ?? LOBBY_COLORS[index % LOBBY_COLORS.length];

const DEFAULT_JOIN_TEXT = "CHOPCHOP.GAME";
/** Below this width:height ratio the lobby stacks into a single column. */
const PORTRAIT_RATIO = 1.15;

const MOCK_PLAYERS: LobbyPlayer[] = [
  { id: "mina", name: "Mina", color: lobbyColor("bear", 0), character: "bear" },
  { id: "jun", name: "Jun", color: lobbyColor("cat", 1), character: "cat" },
  { id: "ari", name: "Ari", color: lobbyColor("panda", 2), character: "panda" },
  { id: "leo", name: "Leo", color: lobbyColor(null, 3), character: null },
];

interface HostLobbyProps {
  roomCode?: string;
  /** In join order; the last one gets the "Hi!" sticker. */
  players?: LobbyPlayer[];
  /** Shown on the badge's lower arc as "OR VISIT …". */
  joinText?: string;
  /** Link encoded in the QR code; the badge shows a placeholder without it. */
  joinUrl?: string;
  onStart?: () => void;
  canStart?: boolean;
  notice?: string;
}

/**
 * Fills its parent. Blocks are authored at the design's 1920×1080 pixel values and
 * zoomed by `scale`; the grid around them reflows for wide vs. tall screens.
 */
export function HostLobbyNew(props: HostLobbyProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const update = () => setSize({ w: root.clientWidth, h: root.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const portrait = size ? size.w / size.h < PORTRAIT_RATIO : false;
  const scale = size
    ? portrait
      ? Math.min(size.w / 1080, size.h / 1920)
      : Math.min(size.w / 1920, size.h / 1080)
    : 1;

  return (
    <div
      ref={rootRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#FCEBC7",
        fontFamily: "Nunito, sans-serif",
        color: INK,
      }}
    >
      <VeggieBackground />
      {size && <LobbyLayout {...props} portrait={portrait} scale={scale} />}
    </div>
  );
}

function LobbyLayout({
  roomCode = "YUMI",
  players = MOCK_PLAYERS,
  joinText = DEFAULT_JOIN_TEXT,
  joinUrl,
  onStart,
  canStart = true,
  notice,
  portrait,
  scale,
}: HostLobbyProps & { portrait: boolean; scale: number }) {
  const zoom = (
    area: string,
    extra?: React.CSSProperties,
  ): React.CSSProperties => ({
    gridArea: area,
    zoom: scale,
    minWidth: 0,
    ...extra,
  });

  return (
    <>
      <div
        style={{
          position: "relative",
          height: "100%",
          boxSizing: "border-box",
          padding: `${40 * scale}px ${100 * scale}px ${30 * scale}px`,
          display: "grid",
          ...(portrait
            ? {
                gridTemplateColumns: "minmax(0,1fr)",
                gridTemplateRows: "auto auto 1fr auto",
                gridTemplateAreas: '"brand" "side" "plate" "start"',
                rowGap: 24 * scale,
                justifyItems: "center",
              }
            : {
                // The plate is positioned separately, centred on the one-third line.
                gridTemplateColumns: `${640 * scale}px minmax(0,1fr) ${640 * scale}px`,
                gridTemplateRows: "auto 1fr auto",
                gridTemplateAreas: '"brand brand side" ". . side" ". . start"',
                columnGap: 40 * scale,
                rowGap: 30 * scale,
              }),
        }}
      >
        <div
          style={zoom("brand", {
            justifySelf: portrait ? "center" : "start",
            // Logo sits in front of the plate where they overlap.
            position: "relative",
            zIndex: 2,
          })}
        >
          <Parallax amount={UI_PAN}>
            <Brand centered={portrait} />
          </Parallax>
        </div>
        <div
          style={zoom("side", {
            justifySelf: "center",
            alignSelf: "start",
            // Nudged left of its column's centre (design px; zoom scales it).
            position: "relative",
            left: portrait ? 0 : SIDE_SHIFT,
          })}
        >
          <Parallax amount={UI_PAN}>
            <JoinBadge
              roomCode={roomCode}
              joinText={joinText}
              joinUrl={joinUrl}
            />
          </Parallax>
        </div>
        {portrait ? (
          <div
            style={{
              ...zoom("plate", { alignSelf: "center", justifySelf: "center" }),
              zoom: scale,
            }}
          >
            <PlateStage players={players} />
          </div>
        ) : (
          // Plate is centred on the one-third line, a little below halfway down,
          // behind the logo.
          <div
            style={{
              position: "absolute",
              left: "calc(100% / 3)",
              top: "57%",
              transform: "translate(-50%, -50%)",
              zIndex: 1,
            }}
          >
            <div style={{ zoom: scale * PLATE_ZOOM }}>
              <PlateStage players={players} />
            </div>
          </div>
        )}
        <div
          style={zoom("start", {
            alignSelf: "end",
            // Centred under the join badge, with the same nudge.
            justifySelf: "center",
            position: "relative",
            left: portrait ? 0 : SIDE_SHIFT,
          })}
        >
          <Parallax amount={UI_PAN}>
            <StartRow onStart={onStart} canStart={canStart} notice={notice} />
          </Parallax>
        </div>
      </div>
    </>
  );
}

function Brand({ centered }: { centered: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: centered ? "center" : "flex-start",
      }}
    >
      <ChopChopLogo width={600} style={{ marginTop: 24 }} />
    </div>
  );
}

function JoinBadge({
  roomCode,
  joinText,
  joinUrl,
}: {
  roomCode: string;
  joinText: string;
  joinUrl?: string;
}) {
  const arcText = `OR VISIT ${joinText.toUpperCase()}`;
  const arcFontSize = Math.min(
    36,
    Math.floor((780 / arcText.length - 3) / 0.55),
  );
  const codeFontSize = roomCode.length <= 4 ? 130 : 100;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 16px 0",
      }}
    >
      <div
        style={{
          ...paper("50%", 0),
          position: "relative",
          width: 600,
          height: 600,
          background: SKY,
          boxSizing: "border-box",
          transform: "rotate(3deg)",
        }}
      >
        <svg
          viewBox="0 0 588 588"
          width="588"
          height="588"
          style={{ position: "absolute", inset: 0 }}
        >
          <defs>
            <path id="lobbyTop" d="M69 294 A225 225 0 0 1 519 294" />
            <path id="lobbyBot" d="M32 294 A262 262 0 0 0 556 294" />
          </defs>
          <text fontFamily="Sniglet" fontSize="44" fill={INK} letterSpacing="4">
            <textPath href="#lobbyTop" startOffset="50%" textAnchor="middle">
              SCAN TO JOIN ✦ SCAN TO JOIN
            </textPath>
          </text>
          <text
            fontFamily="Sniglet"
            fontSize={arcFontSize}
            fill={INK}
            letterSpacing="3"
          >
            <textPath href="#lobbyBot" startOffset="50%" textAnchor="middle">
              {arcText}
            </textPath>
          </text>
        </svg>
        <div
          style={{
            ...paper(34, 1),
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            width: 270,
            height: 270,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {joinUrl ? (
            <QRCodeSVG
              value={joinUrl}
              size={220}
              bgColor="#ffffff"
              fgColor={INK}
              title="Scan to join"
            />
          ) : (
            <div
              style={{
                width: 220,
                height: 220,
                borderRadius: 16,
                background: `repeating-linear-gradient(45deg,${DOT} 0 10px,#fff 10px 20px)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                font: "700 18px ui-monospace,monospace",
              }}
            >
              QR code
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          ...paper(36, 2),
          position: "relative",
          zIndex: 1,
          marginTop: -30,
          transform: "rotate(-3deg)",
          background: SUN,
          padding: "14px 48px 18px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <span style={{ font: nunito(900, 26), letterSpacing: ".14em" }}>
          ROOM CODE
        </span>
        <span
          style={{
            font: lilita(codeFontSize, 1),
            letterSpacing: ".14em",
            whiteSpace: "nowrap",
          }}
        >
          {roomCode}
        </span>
      </div>
    </div>
  );
}

/** How much larger than its 600×520 design size the plate is drawn in landscape. */
const PLATE_ZOOM = 1.25;

/**
 * Mouse parallax depth, back to front: veggie border (6px, in VeggieBackground),
 * logo and room code (UI_PAN), then the plate and chefs (PLATE_PAN, also scaled
 * by PLATE_ZOOM). Values are design px, so they scale with the screen.
 */
const UI_PAN = 10;

/** Landscape: how far (design px) the join badge and start row sit left of their column centre. */
const SIDE_SHIFT = -200;
const PLATE_PAN = 16;

/** Drifts its children toward the mouse by up to `amount` px. */
function Parallax({
  amount,
  children,
}: {
  amount: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const dx = (e.clientX / window.innerWidth - 0.5) * 2;
      const dy = (e.clientY / window.innerHeight - 0.5) * 2;
      el.style.transform = `translate(${dx * amount}px, ${dy * amount}px)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [amount]);

  return (
    <div
      ref={ref}
      style={{
        transition: "transform 450ms cubic-bezier(.2,.8,.2,1)",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}

// Fixed 2×2 spots on the 600×520 plate stage (bottom-centre anchor, design px), filled in
// join order: top-left, top-right, bottom-left, bottom-right.
const PLATE_SLOTS = [
  { x: 190, y: 300 },
  { x: 410, y: 300 },
  { x: 190, y: 470 },
  { x: 410, y: 470 },
];
const CHEF_HEIGHT = 230;

const PLATE_CSS = `
@keyframes lobbyChefPop {
  0% { transform: translateY(40px) scale(.2); opacity: 0; }
  60% { transform: translateY(-8px) scale(1.12); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes lobbyDot {
  0%, 80%, 100% { transform: translateY(0); opacity: .35; }
  40% { transform: translateY(-12px); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .lobby-chef, .lobby-dot { animation: none !important; }
}
`;

/** Players' chefs standing on a plate; players still choosing show an animated "…". */
function PlateStage({ players }: { players: LobbyPlayer[] }) {
  const panRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: MouseEvent) => {
      const el = panRef.current;
      if (!el) return;
      const dx = (e.clientX / window.innerWidth - 0.5) * 2;
      const dy = (e.clientY / window.innerHeight - 0.5) * 2;
      el.style.transform = `translate(${dx * PLATE_PAN}px, ${dy * PLATE_PAN}px)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const shown = players.slice(0, PLATE_SLOTS.length);
  const slots = PLATE_SLOTS;
  const newestWithChef = [...shown].reverse().find((p) => p.character)?.id;

  return (
    <div style={{ position: "relative", width: 600, height: 520 }}>
      <style>{PLATE_CSS}</style>
      <div
        ref={panRef}
        style={{
          position: "absolute",
          inset: 0,
          transition: "transform 450ms cubic-bezier(.2,.8,.2,1)",
          willChange: "transform",
        }}
      >
        <div
          role="status"
          aria-live="polite"
          style={{
            ...paper(24, 3),
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%) rotate(-1.5deg)",
            marginTop: 14,
            zIndex: 2,
            padding: "6px 24px",
            background: "#fff",
            font: nunito(900, 28),
            whiteSpace: "nowrap",
          }}
        >
          {Math.min(players.length, PLATE_SLOTS.length)}/{PLATE_SLOTS.length}{" "}
          chefs in
        </div>

        <img
          src={PLATE_IMAGE}
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            left: 20,
            bottom: 0,
            width: 560,
            filter: "drop-shadow(0 14px 0 rgba(122,78,30,.14))",
          }}
        />

        {shown.length === 0 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 230,
              textAlign: "center",
              font: lilita(38),
              opacity: 0.45,
            }}
          >
            Chefs appear here!
          </div>
        )}

        {shown.map((player, i) => {
          const slot = slots[i];
          const character = player.character;
          return (
            <div
              key={player.id}
              style={{
                position: "absolute",
                left: slot.x,
                top: slot.y,
                zIndex: Math.round(slot.y),
                transform: "translate(-50%, -100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity: player.connected === false ? 0.4 : 1,
              }}
            >
              {character ? (
                <div style={{ position: "relative" }}>
                  <img
                    key={character}
                    className="lobby-chef"
                    src={characterImage(character)}
                    alt=""
                    draggable={false}
                    style={{
                      display: "block",
                      height: CHEF_HEIGHT,
                      transformOrigin: "50% 100%",
                      animation:
                        "lobbyChefPop 520ms cubic-bezier(.2,.9,.3,1.2) both",
                    }}
                  />
                  {player.id === newestWithChef && (
                    <div
                      style={{
                        ...paper("50%", 3),
                        position: "absolute",
                        top: -18,
                        right: -30,
                        transform: "rotate(3deg)",
                        width: 76,
                        height: 76,
                        background: SUN,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        font: lilita(26),
                      }}
                    >
                      Hi!
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    ...paper("50%", 4),
                    width: 150,
                    height: 150,
                    marginBottom: 40,
                    background: "#fff",
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                  }}
                  aria-label={`${player.name} is picking a chef`}
                >
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="lobby-dot"
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: INK,
                        animation: `lobbyDot 1.1s ease-in-out ${d * 0.15}s infinite`,
                      }}
                    />
                  ))}
                </div>
              )}
              <div style={{ marginTop: -14, position: "relative", zIndex: 1 }}>
                <NamePill
                  name={player.name}
                  color={player.color}
                  size={26}
                  maxWidth={200}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StartRow({
  onStart,
  canStart,
  notice,
}: {
  onStart?: () => void;
  canStart: boolean;
  notice?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        padding: "0 16px 70px",
      }}
    >
      {notice && (
        <span
          style={{
            background: "#FFE1DA",
            ...paper(22, 24),
            padding: "6px 18px",
            font: nunito(800, 22),
          }}
        >
          {notice}
        </span>
      )}
      <button
        type="button"
        onClick={onStart}
        disabled={!canStart}
        style={{
          ...paper(75, 5),
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 22,
          height: 150,
          padding: "0 60px 0 30px",
          background: LEAF,
          boxSizing: "border-box",
          color: INK,
          cursor: canStart ? "pointer" : "not-allowed",
          opacity: canStart ? 1 : 0.5,
        }}
      >
        <div
          style={{
            ...paper("50%", 6),
            width: 92,
            height: 92,
            background: SUN,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24">
            <path
              d="M7 4 L20 12 L7 20 Z"
              fill={INK}
              stroke={INK}
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span style={{ font: lilita(100, 1) }}>Start!</span>
      </button>
    </div>
  );
}
