import type { GameConnection } from "#/lib/use-game-connection";
import { useEffect, useMemo, useRef, useState } from "react";
import { Store, iconIdFor } from "./Store";
import type { Ingredient } from "#/lib/types";
import ingredients from "../../data/ingredients.json";
import { MasterRecipe } from "../MasterRecipe";
import { CursorPathTracker } from "../CursorPathTracker";
import type { CursorPoint } from "../CursorPathTracker";
import {
  CARD_BG,
  INK,
  LEAF,
  ROYAL,
  TOMATO,
  lilita,
  nunito,
} from "#/components/chop-chop/design";
import {
  Basket,
  COUNTER_BG,
  PhoneTopBar,
  StoreButton,
} from "#/components/chop-chop/race";
import { TimesUp } from "#/components/chop-chop/screens/TimesUp";

interface ClientInterfaceProps {
  connection: GameConnection;
}

/** Shows a "finish recipe" button so points can be tested without tracing. Turn off for real play. */
const SHOW_TEST_CONTROLS = true;

type ClientInterfaceState = "store" | "recipe";

export function ClientInterface({ connection }: ClientInterfaceProps) {
  const { recipeOrder } = connection.state;
  const [interfaceState, setInterfaceState] =
    useState<ClientInterfaceState>("store");
  const [recipeState, setRecipeState] = useState<number>(0);
  const [activeStageIndex, setActiveStageIndex] = useState(-1);
  const [canPrepareRecipe, setCanPrepareRecipe] = useState(false);
  const [finished, setFinished] = useState(false);
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

  function completeRecipe() {
    connection.socketRef.current?.emit("recipe_completed");
    if (recipeState + 1 < recipeOrder.length) {
      const nextRecipeIndex = recipeState + 1;
      setRecipeState(nextRecipeIndex);
      setActiveStageIndex(-1);
      setCanPrepareRecipe(hasIngredientsForStage(nextRecipeIndex, 0));
    } else {
      setFinished(true);
    }
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

  const total = recipeOrder.length;
  const recipesDone = recipeState + (finished ? 1 : 0);
  const progress = total ? Math.round((recipesDone / total) * 100) : 0;
  const myPoints = connection.playerId
    ? (connection.scores[connection.playerId] ?? 0)
    : 0;

  if (connection.results) {
    return (
      <div
        style={{
          ...COUNTER_BG,
          position: "relative",
          width: "100vw",
          height: "100dvh",
          overflow: "hidden",
        }}
      >
        <TimesUp />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 40,
            zIndex: 60,
            textAlign: "center",
          }}
        >
          <span
            style={{
              background: "#fff",
              border: `4px solid ${INK}`,
              borderRadius: 24,
              padding: "8px 20px",
              font: nunito(900, 18),
              color: INK,
            }}
          >
            Look at the big screen for scores!
          </span>
        </div>
      </div>
    );
  }

  if (interfaceState == "store") {
    return (
      <Store
        uploadInventory={checkoutFromStore}
        score={myPoints}
        progress={progress}
        notice={total === 0 ? "Waiting for the recipes…" : undefined}
      />
    );
  }

  const recipe = recipeOrder.at(recipeState);
  const ready = canPrepareRecipe && !finished && recipe;

  return (
    <div
      style={{
        ...COUNTER_BG,
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        fontFamily: "Nunito, sans-serif",
        color: INK,
      }}
    >
      {/* Real pixels on purpose: the recipe's line targets are measured in screen pixels. */}
      <div
        style={{
          position: "relative",
          width: "min(100vw, 430px)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          paddingTop: 132,
          boxSizing: "border-box",
        }}
      >
        <PhoneTopBar
          mood={finished ? "delighted" : ready ? "focused" : "worried"}
          progress={progress}
          score={myPoints}
        />

        <Basket
          items={inventory.map(iconIdFor)}
          width={354}
          height={104}
          token={48}
        />

        <div style={{ textAlign: "center" }}>
          <div style={{ font: nunito(900, 15), letterSpacing: ".14em" }}>
            {total > 0
              ? `RECIPE ${Math.min(recipeState + 1, total)} OF ${total}`
              : "WAITING FOR RECIPES"}
          </div>
          {recipe && (
            <div style={{ font: lilita(32, 1.1), marginTop: 4 }}>
              {recipe.name}
            </div>
          )}
        </div>

        <div
          style={{
            background: CARD_BG,
            border: `5px solid ${INK}`,
            borderRadius: 34,
            boxShadow: `0 0 0 6px ${ROYAL},0 14px 0 6px rgba(43,42,107,.16)`,
            padding: 12,
            minWidth: 300,
            minHeight: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {finished ? (
            <div
              style={{
                background: LEAF,
                border: `4px solid ${INK}`,
                borderRadius: 26,
                padding: "10px 22px",
                font: lilita(32),
              }}
            >
              All recipes done!
            </div>
          ) : ready ? (
            <MasterRecipe
              recipe={recipe}
              points={currentPoints}
              onStageChange={setActiveStageIndex}
              onCompleteChange={(complete) => {
                if (complete) completeRecipe();
              }}
            />
          ) : (
            recipe && (
              <div
                style={{
                  maxWidth: 260,
                  textAlign: "center",
                  background: "#FFE1DA",
                  border: `4px solid ${TOMATO}`,
                  borderRadius: 22,
                  padding: "14px 18px",
                  font: nunito(900, 18),
                }}
              >
                You're missing ingredients for this recipe. Tap the store to
                grab them.
              </div>
            )
          )}
        </div>

        {ready && (
          <div style={{ font: nunito(800, 16) }}>
            Trace each line with your finger
          </div>
        )}
      </div>

      {ready && (
        <div style={{ position: "fixed", inset: 0, zIndex: 30 }}>
          <CursorPathTracker onPointsChange={setCurrentPoints} />
        </div>
      )}

      <div
        style={{
          position: "fixed",
          left: 0,
          bottom: 0,
          width: 110,
          height: 110,
          zIndex: 40,
        }}
      >
        <StoreButton onClick={() => setInterfaceState("store")} />
      </div>

      {SHOW_TEST_CONTROLS && ready && (
        <button
          type="button"
          onClick={completeRecipe}
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 40,
            background: "#fff",
            border: `4px dashed ${INK}`,
            borderRadius: 24,
            padding: "8px 20px",
            font: nunito(900, 16),
            color: INK,
            cursor: "pointer",
          }}
        >
          Test: finish recipe
        </button>
      )}
    </div>
  );
}
