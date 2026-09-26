import type { GameConnection } from "#/lib/use-game-connection";
import { useEffect, useMemo, useRef, useState } from "react";
import { Store } from "./Store";
import type { Ingredient } from "#/lib/types";
import ingredients from "../../data/ingredients.json";
import { MasterRecipe } from "../MasterRecipe";
import { CursorPathTracker } from "../CursorPathTracker";
import type { CursorPoint } from "../CursorPathTracker";

interface ClientInterfaceProps {
  connection: GameConnection;
}

type ClientInterfaceState = "store" | "recipe";

export function ClientInterface({ connection }: ClientInterfaceProps) {
  const { recipeOrder } = connection.state;
  const [interfaceState, setInterfaceState] =
    useState<ClientInterfaceState>("store");
  const [recipeState, setRecipeState] = useState<number>(0);
  const [activeStageIndex, setActiveStageIndex] = useState(-1);
  const [canPrepareRecipe, setCanPrepareRecipe] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<CursorPoint[]>([]);
  const consumedStages = useRef(new Set<string>());
  const inventory = useMemo(() => {
    const player = connection.state.players.find(
      (entry) => entry.id === connection.playerId,
    );
    if (!player) return [];

    return Object.entries(player.inventory).flatMap(([id, count]) => {
      const ingredient = ingredients.find((entry) => entry.id === Number(id));
      return ingredient ? Array.from({ length: count }, () => ingredient) : [];
    });
  }, [connection.playerId, connection.state.players]);

  function checkoutFromStore(inv: Ingredient[]) {
    const purchaseMap = new Map<number, { id: number; count: number }>();

    inv.forEach((v) => {
      const exists = purchaseMap.get(v.id);
      if (exists) purchaseMap.set(v.id, { id: v.id, count: exists.count + 1 });
      else purchaseMap.set(v.id, { id: v.id, count: 1 });
    });

    if (purchaseMap.size > 0) {
      connection.socketRef.current?.emit(
        "purchase_items",
        Array.from(purchaseMap.values()),
      );
    }

    setCanPrepareRecipe(hasIngredientsForStage(recipeState, 0, inv));
    setInterfaceState("recipe");
  }

  function hasIngredientsForStage(
    recipeIndex: number,
    stageIndex: number,
    additionalIngredients: Ingredient[] = [],
  ): boolean {
    const available = new Map<number, number>();
    for (const ingredient of [...inventory, ...additionalIngredients]) {
      available.set(ingredient.id, (available.get(ingredient.id) ?? 0) + 1);
    }

    const ingredientsConsumed =
      recipeOrder[recipeIndex]?.stages[stageIndex]?.ingredientsConsumed ?? {};
    return Object.entries(ingredientsConsumed).every(
      ([id, count]) => (available.get(Number(id)) ?? 0) >= count,
    );
  }

  useEffect(() => {
    if (activeStageIndex < 0) return;

    const stageKey = `${recipeState}:${activeStageIndex}`;
    if (consumedStages.current.has(stageKey)) return;

    const ingredientsConsumed =
      recipeOrder[recipeState]?.stages[activeStageIndex]?.ingredientsConsumed;
    if (!ingredientsConsumed) return;

    const items = Object.entries(ingredientsConsumed)
      .filter(([, count]) => count > 0)
      .map(([id, count]) => ({ id: Number(id), count }));
    if (items.length === 0) {
      consumedStages.current.add(stageKey);
      return;
    }

    const available = new Map<number, number>();
    for (const ingredient of inventory) {
      available.set(ingredient.id, (available.get(ingredient.id) ?? 0) + 1);
    }
    if (items.some(({ id, count }) => (available.get(id) ?? 0) < count)) {
      return;
    }

    consumedStages.current.add(stageKey);
    connection.socketRef.current?.emit("consume_ingredients", items);
  }, [
    activeStageIndex,
    connection.socketRef,
    inventory,
    recipeOrder,
    recipeState,
  ]);

  return (
    <div>
      <h2>Client interface</h2>
      <p>
        {recipeOrder.length === 0
          ? "Waiting for game state…"
          : `${recipeOrder.length} recipes received`}
      </p>
      {interfaceState == "store" ? (
        <Store uploadInventory={checkoutFromStore}></Store>
      ) : (
        <>
          <p>Inventory</p>
          <div className="flex flex-row gap-1">
            {inventory.map((v) => (
              <img className="w-12 h-12" src={v.image} />
            ))}
          </div>
          <p>
            In recipe {recipeState + 1} / {recipeOrder.length}
          </p>
          <div className="relative overflow-hidden">
            {canPrepareRecipe ? (
              <>
                <CursorPathTracker onPointsChange={setCurrentPoints} />
                <MasterRecipe
                  recipe={recipeOrder[recipeState]}
                  points={currentPoints}
                  onStageChange={setActiveStageIndex}
                  onCompleteChange={(complete) => {
                    if (complete && recipeState + 1 < recipeOrder.length) {
                      const nextRecipeIndex = recipeState + 1;
                      setRecipeState(nextRecipeIndex);
                      setActiveStageIndex(-1);
                      setCanPrepareRecipe(
                        hasIngredientsForStage(nextRecipeIndex, 0),
                      );
                    }
                  }}
                />
              </>
            ) : (
              <p>
                You are missing ingredients for this recipe. Return to the
                store.
              </p>
            )}
          </div>
          <button
            type="button"
            className="border z-100 cursor-pointer"
            onClick={() => setInterfaceState("store")}
          >
            Return to Store
          </button>
        </>
      )}
    </div>
  );
}
