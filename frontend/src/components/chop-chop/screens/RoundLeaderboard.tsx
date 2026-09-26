import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  INK,
  LEAF,
  PINK,
  ROYAL,
  SUN,
  Sparkle,
  lilita,
  nunito,
} from "../design";
import { CONFETTI } from "./HostVictoryNew";

export type LeaderboardEntry = {
  id: string;
  name: string;
  color: string;
  points: number;
};

/** Ordinal label for a 1-based rank. */
const ordinal = (n: number) => {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
};

/**
 * Individual end-of-round leaderboard. Fills its parent; one bar per player,
 * each bar's height proportional to that player's points.
 */
export function RoundLeaderboard({
  entries,
  onLobby,
  onNextRound,
}: {
  entries: LeaderboardEntry[];
  onLobby?: () => void;
  onNextRound?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  const [grown, setGrown] = useState(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const update = () =>
      setScale(Math.min(root.clientWidth / 1920, root.clientHeight / 1080));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  // Start the bars at zero, then let them grow to their height.
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const s = scale ?? 1;
  const px = (n: number) => `${n * s}px`;
  const ranked = [...entries].sort((a, b) => b.points - a.points);
  const top = Math.max(1, ...ranked.map((e) => e.points));
  const rankOf = (points: number) =>
    ranked.findIndex((e) => e.points === points) + 1;

  return (
    <div
      ref={rootRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#EEF8D6",
        fontFamily: "Nunito, sans-serif",
        color: INK,
      }}
    >
      {scale !== null && (
        <>
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: `${(c.x / 1920) * 100}%`,
                top: `${(c.y / 1080) * 100}%`,
                width: c.w * s,
                height: c.h * s,
                borderRadius: c.r,
                background: c.color,
                border: `${3 * s}px solid ${INK}`,
                transform: `rotate(${c.rot}deg)`,
              }}
            />
          ))}
          <Sparkle
            kind="star"
            color={SUN}
            size={64 * s}
            style={{ position: "absolute", left: "27%", top: "6%" }}
          />
          <Sparkle
            kind="plus"
            color={PINK}
            size={36 * s}
            style={{ position: "absolute", right: "24%", top: "15%" }}
          />

          <div
            style={{
              position: "relative",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: `${44 * s}px ${90 * s}px ${50 * s}px`,
              boxSizing: "border-box",
              gap: 30 * s,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 26 * s,
              }}
            >
              <div
                style={{
                  transform: "rotate(-3deg)",
                  background: ROYAL,
                  border: `${6 * s}px solid ${INK}`,
                  borderRadius: 48 * s,
                  padding: `${10 * s}px ${70 * s}px ${22 * s}px`,
                  boxShadow: `0 0 0 ${14 * s}px ${SUN},0 ${22 * s}px 0 ${14 * s}px rgba(43,42,107,.18)`,
                  font: lilita(130 * s, 1),
                  color: "#fff",
                  WebkitTextStroke: `${14 * s}px ${INK}`,
                  paintOrder: "stroke fill",
                  whiteSpace: "nowrap",
                }}
              >
                Round Clear!
              </div>
              <span
                style={{
                  transform: "rotate(2deg)",
                  background: "#fff",
                  border: `${4 * s}px solid ${INK}`,
                  borderRadius: 22 * s,
                  padding: `${4 * s}px ${22 * s}px`,
                  font: nunito(900, 26 * s),
                  letterSpacing: ".14em",
                }}
              >
                LEADERBOARD
              </span>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: 0,
                width: "100%",
                display: "flex",
                alignItems: "stretch",
                justifyContent: "center",
                gap: 48 * s,
                paddingTop: 130 * s,
                boxSizing: "border-box",
              }}
            >
              {ranked.length === 0 && (
                <div
                  style={{
                    alignSelf: "center",
                    font: nunito(900, 34 * s),
                  }}
                >
                  No chefs this round.
                </div>
              )}
              {ranked.map((entry) => {
                const rank = rankOf(entry.points);
                const pct = Math.max(4, (entry.points / top) * 100);
                return (
                  <div
                    key={entry.id}
                    style={{
                      flex: `0 1 ${220 * s}px`,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 14 * s,
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        flex: 1,
                        minHeight: 0,
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: grown ? `${pct}%` : "0%",
                          transition: "height 900ms cubic-bezier(.2,.9,.3,1.1)",
                          background: entry.color,
                          border: `${5 * s}px solid ${INK}`,
                          borderRadius: `${28 * s}px ${28 * s}px ${10 * s}px ${10 * s}px`,
                          boxShadow: `0 0 0 ${8 * s}px #fff,0 ${14 * s}px 0 ${8 * s}px rgba(43,42,107,.15)`,
                          boxSizing: "border-box",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            left: 16 * s,
                            top: 14 * s,
                            width: 14 * s,
                            height: 44 * s,
                            maxHeight: "40%",
                            borderRadius: 7 * s,
                            background: "#fff",
                            opacity: 0.55,
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            left: "50%",
                            bottom: "100%",
                            transform: "translateX(-50%)",
                            marginBottom: 22 * s,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 6 * s,
                          }}
                        >
                          <span
                            style={{
                              transform: `rotate(${rank === 1 ? -6 : 4}deg)`,
                              background: rank === 1 ? SUN : "#fff",
                              border: `${4 * s}px solid ${INK}`,
                              borderRadius: 22 * s,
                              padding: `${2 * s}px ${16 * s}px`,
                              boxShadow: `0 0 0 ${5 * s}px #fff`,
                              font: lilita(28 * s),
                            }}
                          >
                            {ordinal(rank)}
                          </span>
                          <span
                            style={{
                              font: lilita(54 * s, 1),
                              whiteSpace: "nowrap",
                            }}
                          >
                            {entry.points}
                            <span style={{ font: nunito(900, 22 * s) }}>
                              {" "}
                              pts
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10 * s,
                        maxWidth: "100%",
                        background: "#fff",
                        border: `${4 * s}px solid ${INK}`,
                        borderRadius: 28 * s,
                        padding: `${6 * s}px ${20 * s}px ${6 * s}px ${8 * s}px`,
                        boxShadow: `0 0 0 ${6 * s}px ${entry.color}`,
                        boxSizing: "border-box",
                      }}
                    >
                      <span
                        style={{
                          width: 26 * s,
                          height: 26 * s,
                          flexShrink: 0,
                          borderRadius: "50%",
                          background: entry.color,
                          border: `${3 * s}px solid ${INK}`,
                          boxSizing: "border-box",
                        }}
                      />
                      <span
                        style={{
                          font: lilita(32 * s),
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                alignSelf: "flex-end",
                display: "flex",
                alignItems: "center",
                gap: 30 * s,
              }}
            >
              <div
                onClick={onLobby}
                role={onLobby ? "button" : undefined}
                style={{
                  height: 104 * s,
                  padding: `0 ${44 * s}px`,
                  borderRadius: 52 * s,
                  background: "#fff",
                  border: `${5 * s}px solid ${INK}`,
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  font: lilita(46 * s),
                  cursor: onLobby ? "pointer" : undefined,
                }}
              >
                Lobby
              </div>
              <div
                onClick={onNextRound}
                role={onNextRound ? "button" : undefined}
                style={{
                  position: "relative",
                  height: 124 * s,
                  padding: `0 ${64 * s}px`,
                  borderRadius: 62 * s,
                  background: LEAF,
                  border: `${5 * s}px solid ${INK}`,
                  boxSizing: "border-box",
                  boxShadow: `inset 0 -${10 * s}px 0 rgba(43,42,107,.18),0 0 0 ${10 * s}px #fff,0 ${14 * s}px 0 ${10 * s}px rgba(43,42,107,.15)`,
                  display: "flex",
                  alignItems: "center",
                  font: lilita(70 * s),
                  cursor: onNextRound ? "pointer" : undefined,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: px(44),
                    top: px(16),
                    width: px(70),
                    height: px(14),
                    borderRadius: px(7),
                    background: "#fff",
                    opacity: 0.6,
                  }}
                />
                Next Round!
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const PREVIEW_ENTRIES: LeaderboardEntry[] = [
  { id: "mina", name: "Mina", color: ROYAL, points: 500 },
  { id: "jun", name: "Jun", color: "#F2553D", points: 300 },
  { id: "ari", name: "Ari", color: "#159A6B", points: 300 },
  { id: "leo", name: "Leo", color: PINK, points: 100 },
];

/** Dev-switcher previews. */
export function LeaderboardPreview() {
  return <RoundLeaderboard entries={PREVIEW_ENTRIES} />;
}
export function LeaderboardSoloPreview() {
  return (
    <RoundLeaderboard entries={[{ ...PREVIEW_ENTRIES[0], points: 200 }]} />
  );
}
