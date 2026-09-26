import React, { useState } from "react";
import { Pill } from "../Pill";
import { PLAYER_COLORS } from "#/data/chop-chop-mock";

const demoPlayer = { name: "Jordan", color: PLAYER_COLORS[1], avatar: "J" };
const currentItem = {
  name: "Basil Oil",
  emoji: "🌿",
  optimalRange: { min: 60, max: 80 },
};

export function MobileStove() {
  const [isHolding, setIsHolding] = useState(false);
  const [currentHeat, setCurrentHeat] = useState(0);
  const [result, setResult] = useState<
    "perfect" | "undercooked" | "burned" | null
  >(null);

  const handleMouseDown = () => {
    setIsHolding(true);
    setResult(null);
    // Simulate heat increase
    const interval = setInterval(() => {
      setCurrentHeat((h) => {
        if (h >= 100) {
          clearInterval(interval);
          return 100;
        }
        return h + 2;
      });
    }, 50);
  };

  const handleMouseUp = () => {
    setIsHolding(false);
    if (currentHeat < currentItem.optimalRange.min) {
      setResult("undercooked");
    } else if (currentHeat > currentItem.optimalRange.max) {
      setResult("burned");
    } else {
      setResult("perfect");
    }
  };

  return (
    <div className="w-full h-screen max-w-sm mx-auto overflow-hidden flex flex-col bg-[var(--bg)] dot-grid">
      {/* Station header */}
      <div className="p-4 border-b-4 border-[var(--ink)]">
        <Pill
          color="royal"
          textColor="text-white"
          className="w-full justify-center"
        >
          Stove Station
        </Pill>
      </div>

      {/* Current item */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-5xl">{currentItem.emoji}</div>
        <h1 className="display-md text-[var(--ink)]">{currentItem.name}</h1>

        {/* Heat gauge */}
        <div className="w-full space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-label text-[var(--ink-soft)]">HEAT</span>
            <span className="text-label font-bold">{currentHeat}°</span>
          </div>
          <div className="h-6 bg-[var(--bg-dots)] rounded-full border-2 border-[var(--ink)] overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-[var(--sky)] via-[var(--sun)] to-[var(--tomato)] transition-all duration-100"
              style={{ width: `${currentHeat}%` }}
            />
            {/* Optimal range markers */}
            <div
              className="absolute top-0 h-full border-l-2 border-[var(--leaf)] pointer-events-none"
              style={{
                left: `${currentItem.optimalRange.min}%`,
              }}
            />
            <div
              className="absolute top-0 h-full border-r-2 border-[var(--leaf)] pointer-events-none"
              style={{
                right: `${100 - currentItem.optimalRange.max}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-[var(--ink-soft)]">
            <span>Too cold</span>
            <span>
              Perfect ({currentItem.optimalRange.min}°–
              {currentItem.optimalRange.max}°)
            </span>
            <span>Burned</span>
          </div>
        </div>
      </div>

      {/* Hold instruction */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="text-center mb-4">
          <div className="text-label mb-2 text-[var(--ink-soft)]">
            HOLD TO COOK
          </div>
          <div className="text-sm text-[var(--ink)]">
            Press and hold when the heat reaches the green zone
          </div>
        </div>

        {/* Hold button */}
        <button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className={`
            w-40 h-40 rounded-full font-display font-bold text-2xl
            border-4 border-[var(--ink)] transition-all duration-100
            ${
              isHolding
                ? "bg-[var(--sun)] scale-95 shadow-[0_2px_0_var(--ink)]"
                : "bg-[var(--surface)] scale-100 shadow-[0_5px_0_var(--ink)]"
            }
          `}
        >
          {isHolding ? "🔥" : "👆"}
        </button>

        {/* Result */}
        {result && (
          <div
            className={`
              px-4 py-2 rounded-full font-bold text-white text-sm
              border-2 border-[var(--ink)]
              ${result === "perfect" ? "bg-[var(--leaf)]" : result === "burned" ? "bg-[var(--tomato)]" : "bg-[var(--sky)]"}
            `}
          >
            {result === "perfect"
              ? "✓ Perfect!"
              : result === "burned"
                ? "❌ Burned!"
                : "❌ Undercooked"}
          </div>
        )}
      </div>

      {/* Bottom: Queue info */}
      <div className="p-4 border-t-4 border-[var(--ink)]">
        <div className="text-xs text-[var(--ink-soft)] text-center">
          2 items in queue
        </div>
      </div>
    </div>
  );
}
