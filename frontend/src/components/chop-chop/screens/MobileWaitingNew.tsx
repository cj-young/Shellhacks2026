import { useEffect, useState } from "react";
import {
  CARD_BG,
  ChefPlaceholder,
  INK,
  MINT,
  PhoneFrame,
  ROYAL,
  SUN,
  Sparkle,
  lilita,
  nunito,
} from "../design";

const DOT_OPACITIES = [1, 0.6, 0.3];

export function MobileWaitingNew() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 3), 400);
    return () => clearInterval(id);
  }, []);

  return (
    <PhoneFrame
      lightChrome
      background={{
        backgroundColor: ROYAL,
        backgroundImage:
          "radial-gradient(rgba(255,255,255,.14) 3px, transparent 3.5px)",
        backgroundSize: "34px 34px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 80,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#fff",
          border: `4px solid ${INK}`,
          borderRadius: 30,
          padding: "8px 20px",
          whiteSpace: "nowrap",
          font: nunito(900, 18),
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: ROYAL,
            border: `3px solid ${INK}`,
          }}
        />
        Mina · PREP station
      </div>

      <Sparkle
        kind="star"
        color={SUN}
        size={44}
        rotate={12}
        style={{ position: "absolute", left: 36, top: 170 }}
      />
      <Sparkle
        kind="plus"
        color="#fff"
        size={26}
        style={{ position: "absolute", right: 46, top: 200 }}
      />
      <Sparkle
        kind="star"
        color={MINT}
        size={30}
        style={{ position: "absolute", right: 40, top: 440 }}
      />
      <Sparkle
        kind="dot"
        color={SUN}
        size={16}
        style={{ position: "absolute", left: 52, top: 470 }}
      />

      <div
        style={{
          position: "absolute",
          top: 170,
          left: "50%",
          transform: "translateX(-50%)",
          width: 290,
          height: 290,
          borderRadius: "50%",
          background: CARD_BG,
          border: `5px solid ${INK}`,
          boxSizing: "border-box",
          boxShadow: `0 0 0 10px ${SUN}`,
        }}
      />
      <ChefPlaceholder
        color={ROYAL}
        size={250}
        style={{
          position: "absolute",
          top: 156,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 520,
          left: 24,
          right: 24,
          textAlign: "center",
          font: lilita(54, 1.02),
          color: "#fff",
          WebkitTextStroke: `10px ${INK}`,
          paintOrder: "stroke fill",
          textShadow: `0 6px 0 ${INK}`,
        }}
      >
        Look at the big screen!
      </div>

      <div
        style={{
          position: "absolute",
          top: 676,
          left: "50%",
          transform: "translateX(-50%) rotate(-4deg)",
          width: 110,
          height: 72,
          background: "#fff",
          border: `4px solid ${INK}`,
          borderRadius: 14,
          boxSizing: "border-box",
          boxShadow: `0 0 0 5px ${SUN}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 78,
            height: 42,
            borderRadius: 6,
            background: MINT,
            border: `3px solid ${INK}`,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 36,
          left: "50%",
          transform: "translateX(-50%)",
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
        Waiting for Start
        <span style={{ display: "flex", gap: 5 }}>
          {DOT_OPACITIES.map((_, i) => (
            <span
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: SUN,
                opacity: DOT_OPACITIES[(i - tick + 3) % 3],
                transition: "opacity 200ms",
              }}
            />
          ))}
        </span>
      </div>
    </PhoneFrame>
  );
}
