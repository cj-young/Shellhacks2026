import React, { useState } from "react";
import { Pill } from "../Pill";
import { PLAYER_COLORS } from "#/data/chop-chop-mock";

const demoPlayer = { name: "Casey", color: PLAYER_COLORS[2], avatar: "C" };
const ingredients = ["🍋", "🌿", "🐟"];

export function MobilePlating() {
  const [platedIngredients, setPlatedIngredients] = useState<string[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState(ingredients);

  const handleDragStart = (
    e: React.DragEvent,
    ingredient: string,
    index: number,
  ) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("ingredient", ingredient);
    e.dataTransfer.setData("index", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const ingredient = e.dataTransfer.getData("ingredient");
    const index = parseInt(e.dataTransfer.getData("index"));

    if (!platedIngredients.includes(ingredient)) {
      setPlatedIngredients([...platedIngredients, ingredient]);
      setAvailableIngredients(
        availableIngredients.filter((_, i) => i !== index),
      );
    }
  };

  const isComplete =
    availableIngredients.length === 0 && platedIngredients.length > 0;

  return (
    <div className="w-full h-screen max-w-sm mx-auto overflow-hidden flex flex-col bg-[var(--bg)] dot-grid">
      {/* Station header */}
      <div className="p-4 border-b-4 border-[var(--ink)]">
        <Pill
          color="royal"
          textColor="text-white"
          className="w-full justify-center"
        >
          Plating Station
        </Pill>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6">
        {/* Available ingredients */}
        <div className="w-full">
          <div className="text-label mb-3 text-center">INGREDIENTS</div>
          <div className="flex justify-center gap-3 flex-wrap">
            {availableIngredients.map((ingredient, i) => (
              <div
                key={i}
                draggable
                onDragStart={(e) => handleDragStart(e, ingredient, i)}
                className="w-14 h-14 rounded-full bg-[var(--surface-white)] border-3 border-[var(--ink)] flex items-center justify-center text-2xl cursor-grab active:cursor-grabbing shadow-[0_3px_0_var(--ink)]"
              >
                {ingredient}
              </div>
            ))}
          </div>
        </div>

        {/* Plate */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            w-40 h-40 rounded-full border-4 flex items-center justify-center
            transition-all duration-200
            ${
              platedIngredients.length > 0
                ? "bg-[var(--sun)] border-[var(--ink)] shadow-[0_5px_0_var(--ink)]"
                : "bg-[var(--surface-white)] border-dashed border-[var(--ink-soft)]"
            }
          `}
        >
          {platedIngredients.length === 0 ? (
            <div className="text-center text-[var(--ink-soft)]">
              <div className="text-3xl mb-1">🍽️</div>
              <div className="text-xs font-bold">Drag here</div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-2xl">
              {platedIngredients.map((ing, i) => (
                <span key={i}>{ing}</span>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        {isComplete && (
          <div className="px-6 py-3 bg-[var(--leaf)] text-white rounded-full font-bold border-2 border-[var(--ink)] shadow-[0_3px_0_var(--ink)]">
            ✓ Plate Complete!
          </div>
        )}
      </div>

      {/* Bottom: Info */}
      <div className="p-4 border-t-4 border-[var(--ink)]">
        <div className="text-xs text-[var(--ink-soft)] text-center">
          Order: Grilled Salmon with Lemon & Herbs
        </div>
      </div>
    </div>
  );
}
