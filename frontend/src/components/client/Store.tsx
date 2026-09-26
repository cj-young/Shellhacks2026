import type { Ingredient } from "#/lib/types";
import { useState } from "react";
import ingredients from "../../data/ingredients.json";

export function Store({
  uploadInventory,
  onCartChange,
}: {
  uploadInventory: (inv: Ingredient[]) => void;
  onCartChange: (cart: Ingredient[]) => void;
}) {
  const [inventory, setInventory] = useState<Ingredient[]>([]);

  function checkout() {
    uploadInventory(inventory);
    setInventory([]);
  }

  function addToCart(ingredient: Ingredient) {
    const nextCart = [...inventory, ingredient];
    setInventory(nextCart);
    onCartChange(nextCart);
  }

  return (
    <>
      <div>
        {ingredients.map((ing) => (
          <button type="button" onClick={() => addToCart(ing)}>
            <img className="w-12 h-12" src={ing.image} />
            <p>
              {ing.name} ({ing.category})
            </p>
          </button>
        ))}
      </div>
      <button type="button" className="border" onClick={() => checkout()}>
        Checkout
      </button>
      <div className="flex flex-row gap-1">
        {inventory.map((v) => (
          <img className="w-12 h-12" src={v.image} />
        ))}
      </div>
    </>
  );
}
