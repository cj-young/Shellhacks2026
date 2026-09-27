import type React from "react";
import { CARD_BG, DOT, INK, PAGE_BG, lilita, nunito } from "../design";
import { IngredientIcon } from "../IngredientIcon";
import { INGREDIENTS, RECIPES, SHELVES, dishAsset } from "#/data/menu";
import type { MenuIngredient } from "#/data/menu";

import { paper } from "#/components/chop-chop/paper";
export const ASSET_SHEET_SIZE = { width: 1920, height: 1400 };

const card: React.CSSProperties = {
  ...paper(22, 0),
  background: "#fff",
  padding: "10px 12px 8px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
};
const fileName: React.CSSProperties = {
  font: nunito(800, 13),
  color: INK,
  whiteSpace: "nowrap",
};
const heading: React.CSSProperties = { font: lilita(32), margin: 0 };

function IngredientCell({ ing }: { ing: MenuIngredient }) {
  return (
    <div style={card}>
      <div style={{ display: "flex", gap: 10 }}>
        <IngredientIcon id={ing.id} size={64} />
        <IngredientIcon id={ing.id} size={64} silhouette />
      </div>
      <span style={fileName}>ingredient-{ing.id}</span>
    </div>
  );
}

export function AssetSheet() {
  const decoys = INGREDIENTS.filter((i) => i.decoy);
  return (
    <div
      style={{
        width: ASSET_SHEET_SIZE.width,
        height: ASSET_SHEET_SIZE.height,
        boxSizing: "border-box",
        padding: "40px 48px",
        backgroundColor: PAGE_BG,
        backgroundImage: `radial-gradient(${DOT} 2.5px, transparent 3px)`,
        backgroundSize: "40px 40px",
        color: INK,
        fontFamily: "Nunito, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
        <span style={{ font: lilita(56) }}>Assets · Ingredients & dishes</span>
        <span style={{ font: nunito(800, 20) }}>
          public/assets — swap any file for final art under the same name.
          Silhouettes are for Blackout.
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px 40px" }}>
        {SHELVES.map((shelf) => (
          <section
            key={shelf.id}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <h2 style={heading}>{shelf.name}</h2>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 14,
                maxWidth: 1824,
              }}
            >
              {INGREDIENTS.filter((i) => i.shelf === shelf.id && !i.decoy).map(
                (ing) => (
                  <IngredientCell key={ing.id} ing={ing} />
                ),
              )}
            </div>
          </section>
        ))}
      </div>

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          borderTop: `4px dashed ${DOT}`,
          paddingTop: 20,
        }}
      >
        <h2 style={heading}>Decoys · on the shelves, in no recipe</h2>
        <div style={{ display: "flex", gap: 28 }}>
          {decoys.map((decoy) => {
            const pair = INGREDIENTS.find((i) => i.id === decoy.lookalike);
            return (
              <div
                key={decoy.id}
                style={{
                  ...card,
                  flexDirection: "row",
                  gap: 16,
                  background: CARD_BG,
                  padding: 14,
                }}
              >
                <IngredientCell ing={decoy} />
                <span style={{ font: nunito(900, 18) }}>vs</span>
                {pair && <IngredientCell ing={pair} />}
              </div>
            );
          })}
        </div>
      </section>

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          borderTop: `4px dashed ${DOT}`,
          paddingTop: 20,
        }}
      >
        <h2 style={heading}>Finished dishes</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          {RECIPES.map((recipe) => (
            <div key={recipe.id} style={{ ...card, width: 160 }}>
              <img
                src={dishAsset(recipe.id)}
                alt={recipe.name}
                width={120}
                height={120}
              />
              <span style={{ font: nunito(900, 15), textAlign: "center" }}>
                {recipe.name}
              </span>
              <span style={fileName}>dish-{recipe.id}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
