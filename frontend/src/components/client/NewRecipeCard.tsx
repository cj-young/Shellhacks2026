import { useEffect, useRef } from "react";
import type { Recipe } from "#/lib/types";
import ingredients from "../../data/ingredients.json";
import { RECIPES, dishAsset } from "#/data/menu";
import { IngredientIcon } from "#/components/chop-chop/IngredientIcon";
import {
  CARD_BG,
  INK,
  LEAF,
  SUN,
  TOMATO,
  lilita,
  nunito,
} from "#/components/chop-chop/design";
import { COUNTER_BG } from "#/components/chop-chop/race";
import { paper } from "#/components/chop-chop/paper";
import { iconIdFor } from "./Store";

/** How long the card stays up before heading back to the store on its own. */
const AUTO_CONTINUE_MS = 4200;

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

/** Finds our dish art for a server recipe by name (e.g. "Veggie Stir-Fry" → stir-fry). */
function dishFor(name: string): string | null {
  const n = normalize(name);
  const match = RECIPES.find((r) => {
    const m = normalize(r.name);
    return m === n || m.includes(n) || n.includes(m);
  });
  return match ? dishAsset(match.id) : null;
}

/** Same lookup the host uses for recipe ingredient ids. */
const ingredientById = (id: number) =>
  ingredients.find((i) => i.id === id) ?? ingredients.at(id);

const KEYFRAMES = `
@keyframes nrBackdrop { from { opacity: 0 } to { opacity: 1 } }
@keyframes nrOldTicket {
  0% { transform: translate(-50%, 0) rotate(-2deg); opacity: 1 }
  100% { transform: translate(-50%, 140%) rotate(14deg); opacity: 0 }
}
@keyframes nrTag {
  0% { transform: translateY(-160px) rotate(-3deg); }
  60% { transform: translateY(10px) rotate(3deg); }
  80% { transform: translateY(-4px) rotate(-2deg); }
  100% { transform: translateY(0) rotate(-3deg); }
}
@keyframes nrCard {
  0% { transform: translateY(-120vh) rotate(-16deg); }
  55% { transform: translateY(18px) rotate(4deg); }
  72% { transform: translateY(-8px) rotate(-3deg); }
  86% { transform: translateY(3px) rotate(0deg); }
  100% { transform: translateY(0) rotate(-2deg); }
}
@keyframes nrPop {
  0% { transform: scale(0) rotate(-20deg); opacity: 0 }
  70% { transform: scale(1.15) rotate(4deg); opacity: 1 }
  100% { transform: scale(1) rotate(0); opacity: 1 }
}
@keyframes nrDrain { from { transform: scaleX(1) } to { transform: scaleX(0) } }
`;

/**
 * Full-screen "new order" moment between recipes: the finished ticket slides
 * away, a new recipe card swings in with its dish and shopping list, then the
 * player is sent back to the store.
 */
export function NewRecipeCard({
  recipe,
  number,
  total,
  onContinue,
}: {
  recipe: Recipe;
  /** 1-based position of this recipe in the round. */
  number: number;
  total: number;
  onContinue: () => void;
}) {
  // Keep the latest callback without restarting the timer on every parent render.
  const continueRef = useRef(onContinue);
  continueRef.current = onContinue;
  useEffect(() => {
    const id = setTimeout(() => continueRef.current(), AUTO_CONTINUE_MS);
    return () => clearTimeout(id);
  }, []);

  // Our dish art when the name matches; otherwise the recipe's own final-stage picture.
  const dish =
    dishFor(recipe.name) ??
    [...recipe.stages].reverse().find((s) => s.image)?.image ??
    null;
  const shopping = recipe.ingredients
    .map(({ id, count }) => ({ ing: ingredientById(id), count }))
    .filter((x) => x.ing);

  return (
    <div
      onClick={onContinue}
      style={{
        ...COUNTER_BG,
        position: "fixed",
        inset: 0,
        zIndex: 80,
        overflow: "hidden",
        fontFamily: "Nunito, sans-serif",
        color: INK,
      }}
    >
      <style>{KEYFRAMES}</style>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(61,40,23,.28)",
          animation: "nrBackdrop 300ms ease-out both",
        }}
      />

      {/* The finished ticket clears off the rail. */}
      <div
        style={{
          ...paper(26, 3),
          position: "absolute",
          left: "50%",
          top: "22%",
          width: 280,
          height: 340,
          background: CARD_BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "nrOldTicket 520ms 80ms cubic-bezier(.5,0,.9,.4) both",
        }}
      >
        <span
          style={{
            ...paper(18, 1),
            background: LEAF,
            padding: "6px 18px",
            font: lilita(30),
            transform: "rotate(-6deg)",
          }}
        >
          Done!
        </span>
      </div>

      <div
        style={{
          position: "relative",
          height: "100%",
          maxWidth: 430,
          margin: "0 auto",
          padding: "40px 22px 28px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            ...paper(16, 2),
            background: TOMATO,
            color: CARD_BG,
            padding: "8px 26px",
            font: lilita(34, 1.1),
            animation: "nrTag 700ms 450ms cubic-bezier(.3,1.4,.5,1) both",
          }}
        >
          New order!
        </div>

        <div
          style={{
            ...paper(28, 4),
            width: "100%",
            maxWidth: 340,
            background: CARD_BG,
            padding: "18px 20px 20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            transformOrigin: "50% -40px",
            animation: "nrCard 900ms 650ms cubic-bezier(.25,.9,.35,1) both",
          }}
        >
          {/* Pin holding the ticket to the rail. */}
          <span
            style={{
              ...paper("50%", 1),
              position: "absolute",
              top: -12,
              left: "50%",
              marginLeft: -12,
              width: 24,
              height: 24,
              background: TOMATO,
            }}
          />
          <span style={{ font: nunito(900, 14), letterSpacing: ".14em" }}>
            RECIPE {number} OF {total}
          </span>
          <span style={{ font: lilita(34, 1.05), textAlign: "center" }}>
            {recipe.name}
          </span>
          {dish && (
            <img
              src={dish}
              alt=""
              draggable={false}
              style={{
                width: 150,
                height: 150,
                objectFit: "contain",
                borderRadius: 18,
                animation: "nrPop 520ms 1350ms cubic-bezier(.3,1.5,.5,1) both",
              }}
            />
          )}
          <span
            style={{
              font: nunito(900, 13),
              letterSpacing: ".14em",
              opacity: 0.75,
              marginTop: 2,
            }}
          >
            SHOPPING LIST
          </span>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "8px 12px",
            }}
          >
            {shopping.map(({ ing, count }, i) => (
              <div
                key={ing!.id}
                style={{
                  position: "relative",
                  animation: `nrPop 420ms ${1550 + i * 120}ms cubic-bezier(.3,1.5,.5,1) both`,
                }}
              >
                <IngredientIcon id={iconIdFor(ing!)} size={54} />
                {count > 1 && (
                  <span
                    style={{
                      ...paper("50%", i),
                      position: "absolute",
                      right: -6,
                      bottom: -4,
                      minWidth: 26,
                      height: 26,
                      background: SUN,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      font: nunito(900, 14),
                    }}
                  >
                    ×{count}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onContinue();
          }}
          style={{
            ...paper(38, 0),
            width: "100%",
            maxWidth: 340,
            height: 72,
            background: SUN,
            color: INK,
            font: lilita(34),
            cursor: "pointer",
            overflow: "hidden",
            animation: "nrBackdrop 300ms 1500ms ease-out both",
          }}
        >
          Go shopping ›{/* Drains until the card moves on by itself. */}
          <span
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 6,
              background: "rgba(61,40,23,.22)",
              transformOrigin: "left",
              animation: `nrDrain ${AUTO_CONTINUE_MS}ms linear both`,
            }}
          />
        </button>
      </div>
    </div>
  );
}
