import type { Ingredient } from "#/lib/types";
import { useState } from "react";
import ingredients from "../../data/ingredients.json";
import {
  STORE_PAGE_SIZE,
  StoreScreen,
} from "#/components/chop-chop/screens/RacePhoneScreens";
import { INGREDIENTS as MENU_INGREDIENTS } from "#/data/menu";

const menuIdByName = new Map(
  MENU_INGREDIENTS.map((i) => [i.name.toLowerCase(), i.id]),
);

/** Uses our sticker art when the name matches a menu ingredient, otherwise the item's own image. */
export const iconIdFor = (ing: Ingredient) =>
  menuIdByName.get(ing.name.toLowerCase()) ?? ing.image;

/** One aisle per category, split into pages that fit the store screen. */
const AISLES: { name: string; items: Ingredient[] }[] = (() => {
  const categories = [...new Set(ingredients.map((ing) => ing.category))];
  return categories.flatMap((category) => {
    const items = ingredients.filter((ing) => ing.category === category);
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
  uploadInventory,
  onCartChange,
  score,
  progress,
  notice,
}: {
  uploadInventory: (inv: Ingredient[]) => void;
  onCartChange: (cart: Ingredient[]) => void;
  score: number;
  progress: number;
  notice?: string;
}) {
  const [inventory, setInventory] = useState<Ingredient[]>([]);
  const [aisle, setAisle] = useState(0);

  function checkout() {
    uploadInventory(inventory);
    setInventory([]);
  }

  function addToCart(ingredient: Ingredient) {
    const nextCart = [...inventory, ingredient];
    setInventory(nextCart);
    onCartChange(nextCart);
  }

  const page = AISLES.at(aisle) ?? { name: "STORE", items: [] };
  const flip = (step: number) =>
    setAisle((a) => (a + step + AISLES.length) % Math.max(1, AISLES.length));

  return (
    <StoreScreen
      framed={false}
      score={score}
      progress={progress}
      aisleName={page.name}
      aisleIndex={aisle}
      aisleCount={AISLES.length}
      shelf={page.items.map((ing) => ({ kind: iconIdFor(ing) }))}
      basket={inventory.map(iconIdFor)}
      notice={notice}
      onPrevAisle={() => flip(-1)}
      onNextAisle={() => flip(1)}
      onTake={(slot) => {
        const ing = page.items.at(slot);
        if (ing) addToCart(ing);
      }}
      onLeave={checkout}
    />
  );
}
