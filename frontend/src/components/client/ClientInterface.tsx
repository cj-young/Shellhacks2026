import type { GameConnection } from "#/lib/use-game-connection";
import { useState } from "react";
import { Store, iconIdFor } from "./Store";
import type { Ingredient } from "#/lib/types";
import { MasterRecipe } from "../MasterRecipe";
import { CursorPathTracker } from "../CursorPathTracker";
import type { CursorPoint } from "../CursorPathTracker";
import {
  CARD_BG,
  INK,
  LEAF,
  ROYAL,
  lilita,
  nunito,
} from "#/components/chop-chop/design";
import {
  Basket,
  COUNTER_BG,
  PhoneTopBar,
  StoreButton,
} from "#/components/chop-chop/race";

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
  const [inventory, setInventory] = useState<Ingredient[]>([]);
  const [recipeState, setRecipeState] = useState<number>(0);
  const [finished, setFinished] = useState(false);

  const [currentPoints, setCurrentPoints] = useState<CursorPoint[]>([]);

  function checkoutFromStore(inv: Ingredient[]) {
    setInventory([...inventory, ...inv]);

    const purchaseMap = new Map();

    inv.forEach((v) => {
      const exists = purchaseMap.get(v.id);
      if (exists) purchaseMap.set(v.id, { id: v.id, count: exists.count + 1 });
      else purchaseMap.set(v.id, { id: v.id, count: 1 });
    });

    connection.socketRef.current?.emit(
      "purchase_items",
      Array.from(purchaseMap.values()),
    );
    setInterfaceState("recipe");
  }

  function completeRecipe() {
    connection.socketRef.current?.emit("recipe_completed");
    if (recipeState + 1 < recipeOrder.length) setRecipeState(recipeState + 1);
    else setFinished(true);
  }

  const total = recipeOrder.length;
  const recipesDone = recipeState + (finished ? 1 : 0);
  const progress = total ? Math.round((recipesDone / total) * 100) : 0;
  const myPoints = connection.playerId
    ? (connection.scores[connection.playerId] ?? 0)
    : 0;

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
          mood={finished ? "delighted" : "focused"}
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
          ) : (
            recipe && (
              <MasterRecipe
                recipe={recipe}
                points={currentPoints}
                onCompleteChange={(complete) => {
                  if (complete) completeRecipe();
                }}
              />
            )
          )}
        </div>

        {!finished && recipe && (
          <div style={{ font: nunito(800, 16) }}>
            Trace each line with your finger
          </div>
        )}
      </div>

      <div style={{ position: "fixed", inset: 0, zIndex: 30 }}>
        <CursorPathTracker onPointsChange={setCurrentPoints} />
      </div>

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

      {SHOW_TEST_CONTROLS && !finished && recipe && (
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
