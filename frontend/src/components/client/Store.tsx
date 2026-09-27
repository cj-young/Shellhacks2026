import type { Ingredient } from "#/lib/types";
import { useState } from "react";
import ingredients from "../../data/ingredients.json";
import {
  STORE_PAGE_SIZE,
  StoreScreen,
} from "#/components/chop-chop/screens/RacePhoneScreens";
import { getIngredient, menuIngredientIdFor } from "#/data/menu";
import { useSfx } from "#/audio/use-audio";

/** Uses our sticker art when the name matches a menu ingredient, otherwise the item's own image. */
export const iconIdFor = (ing: Ingredient) =>
  menuIngredientIdFor(ing.name) ?? ing.image;

// Our shelves, with the two produce shelves shown as one aisle since the team's
// catalog only has a few produce items.
const AISLE_FOR_SHELF: Record<string, string> = {
  veggies: "Produce",
  "onions-citrus": "Produce",
  "meat-dairy": "Meat & Dairy",
  "bakery-pantry": "Bakery & Pantry",
};

/** Aisle for a team ingredient: our shelf when we know it, else its own category. */
const aisleFor = (ing: Ingredient) => {
  const shelf = getIngredient(menuIngredientIdFor(ing.name) ?? "")?.shelf;
  return (shelf && AISLE_FOR_SHELF[shelf]) || ing.category;
};

/** One aisle per group, split into pages that fit the store screen. */
const AISLES: { name: string; items: Ingredient[] }[] = (() => {
  const order = Object.values(AISLE_FOR_SHELF);
  const rank = (g: string) =>
    order.includes(g) ? order.indexOf(g) : order.length;
  const groups = [...new Set(ingredients.map(aisleFor))].sort(
    (a, b) => rank(a) - rank(b),
  );
  return groups.flatMap((category) => {
    const items = ingredients.filter((ing) => aisleFor(ing) === category);
    const pages = [];
    for (let i = 0; i < items.length; i += STORE_PAGE_SIZE) {
      pages.push({
        name: category.toUpperCase(),
        items: items.slice(i, i + STORE_PAGE_SIZE),
      });
    }
    return pages;
  });
})();

export function Store({
  blackout = false,
  disabled = false,
  uploadInventory,
  onCartChange,
  score,
  progress,
  notice,
  hint,
}: {
  blackout?: boolean;
  disabled?: boolean;
  uploadInventory: (inv: Ingredient[]) => void;
  onCartChange: (cart: Ingredient[]) => void;
  score: number;
  progress: number;
  notice?: string;
  /** Short instruction between the shelves and the cart. */
  hint?: string;
}) {
  const [inventory, setInventory] = useState<Ingredient[]>([]);
  const [aisle, setAisle] = useState(0);
  const sfx = useSfx();

  function checkout() {
    if (disabled) return;
    sfx.play("ui.checkout");
    uploadInventory(inventory);
    setInventory([]);
  }

  function addToCart(ingredient: Ingredient) {
    if (disabled) return;
    sfx.play("ui.take");
    const nextCart = [...inventory, ingredient];
    setInventory(nextCart);
    onCartChange(nextCart);
  }

  /** Tapping a cart item puts it back on the shelf. */
  function removeFromCart(index: number) {
    if (disabled) return;
    sfx.play("ui.remove");
    const nextCart = inventory.filter((_, i) => i !== index);
    setInventory(nextCart);
    onCartChange(nextCart);
  }

  const page = AISLES.at(aisle) ?? { name: "STORE", items: [] };
  const flip = (step: number) => {
    sfx.play("ui.aisle");
    setAisle((a) => (a + step + AISLES.length) % Math.max(1, AISLES.length));
  };

  return (
    <StoreScreen
      blackout={blackout}
      disabled={disabled}
      framed={false}
      score={score}
      progress={progress}
      aisleName={page.name}
      aisleIndex={aisle}
      aisleCount={AISLES.length}
      shelf={page.items.map((ing) => ({ kind: iconIdFor(ing) }))}
      basket={inventory.map(iconIdFor)}
      notice={notice}
      hint={hint}
      onPrevAisle={() => flip(-1)}
      onNextAisle={() => flip(1)}
      onTake={(slot) => {
        const ing = page.items.at(slot);
        if (ing) addToCart(ing);
      }}
      onBasketTap={removeFromCart}
      onLeave={checkout}
    />
  );
}
