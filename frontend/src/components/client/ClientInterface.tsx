import { paper } from "#/components/chop-chop/paper";
import type React from "react";
import type { GameConnection } from "#/lib/use-game-connection";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  SabotageControls,
  SabotageEffects,
  SabotageLaunchButton,
} from "../sabotage/SabotageUI";
import { Store, iconIdFor } from "./Store";
import type { Ingredient, PlayerInterfaceState } from "#/lib/types";
import ingredients from "../../data/ingredients.json";
import { MasterRecipe } from "../MasterRecipe";
import { CursorPathTracker } from "../CursorPathTracker";
import type { CursorPoint } from "../CursorPathTracker";
import {
  CARD_BG,
  INK,
  LEAF,
  lilita,
  nunito,
} from "#/components/chop-chop/design";
import {
  Basket,
  COUNTER_BG,
  PhoneTopBar,
  TopBarAction,
  TopBarCharacter,
  StoreButton,
} from "#/components/chop-chop/race";
import { TimesUp } from "#/components/chop-chop/screens/TimesUp";
import { NewRecipeCard } from "./NewRecipeCard";
import { ToolCursor, toolRest } from "./ToolCursor";
import { Countdown } from "#/components/chop-chop/Countdown";
import {
  gestureHint,
  stepInfo,
  stepProgress,
  withStepArt,
} from "#/data/recipe-steps";

/** Visible square of the recipe box; stage gestures sit within its 0–200px. */
const GESTURE_AREA = 210;

interface ClientInterfaceProps {
  connection: GameConnection;
}

/** Shows a "finish recipe" button so points can be tested without tracing. Turn off for real play. */
const SHOW_TEST_CONTROLS = import.meta.env.DEV;

export function ClientInterface({ connection }: ClientInterfaceProps) {
  const frozen = connection.sabotages.frozenMs > 0;
  const [sabotageOpen, setSabotageOpen] = useState(false);
  const myCharacter =
    connection.state.players.find((p) => p.id === connection.playerId)
      ?.character ??
    connection.players.find((p) => p.id === connection.playerId)?.character ??
    null;
  // The sabotage button takes the score's spot in the phone top bar.
  const sabotageButton = connection.results ? null : (
    <SabotageLaunchButton
      inline
      credits={connection.sabotages.held.length}
      frozen={frozen}
      onClick={() => setSabotageOpen(true)}
    />
  );
  return (
    <>
      <div inert={frozen}>
        <TopBarAction.Provider value={sabotageButton}>
          <TopBarCharacter.Provider value={myCharacter}>
            <ClientGameplay connection={connection} />
          </TopBarCharacter.Provider>
        </TopBarAction.Provider>
      </div>
      <SabotageControls
        connection={connection}
        open={sabotageOpen}
        onOpenChange={setSabotageOpen}
        showLaunch={false}
      />
      <SabotageEffects connection={connection} />
    </>
  );
}

function ClientGameplay({ connection }: ClientInterfaceProps) {
  const frozen = connection.sabotages.frozenMs > 0;
  const { recipeOrder } = connection.state;
  const [recipeState, setRecipeState] = useState<number>(0);
  const [activeStageIndex, setActiveStageIndex] = useState(-1);
  const [canPrepareRecipe, setCanPrepareRecipe] = useState(false);
  const [finished, setFinished] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<CursorPoint[]>([]);
  /** True while the "new order" card for the next recipe is on screen. */
  const [showNewRecipe, setShowNewRecipe] = useState(false);
  /** Server recipe index we're finishing stages toward (see effect below). */
  const [advanceTo, setAdvanceTo] = useState<number | null>(null);
  const sentFinishFor = useRef<string | null>(null);
  const completedRecipes = useRef(new Set<number>());
  const consumedStages = useRef(new Set<string>());
  const me = connection.state.players.find(
    (entry) => entry.id === connection.playerId,
  );
  const interfaceState = me?.interfaceState ?? "store";
  function setInterfaceState(next: PlayerInterfaceState) {
    if (frozen) return;
    connection.socketRef.current?.emit("update_interface_state", next);
  }

  /** 3-2-1 over everything when the game starts (the host shows the same). */
  const [showCountdown, setShowCountdown] = useState(true);
  // The recipe view uses real pixels (gestures are measured in them), so it
  // sizes itself to the screen height instead of scaling.
  const [viewport, setViewport] = useState(() =>
    typeof window === "undefined"
      ? { width: 390, height: 844 }
      : { width: window.innerWidth, height: window.innerHeight },
  );
  useEffect(() => {
    const onResize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  // The current recipe with placeholder step art swapped in for test pictures.
  const currentRecipe = recipeOrder.at(recipeState);
  const stepRecipe = useMemo(
    () => (currentRecipe ? withStepArt(currentRecipe) : undefined),
    [currentRecipe],
  );
  // Preload this recipe's step pictures so each one is ready when it shows.
  useEffect(() => {
    for (const stage of stepRecipe?.stages ?? []) {
      for (const src of [
        stage.image,
        stage.finishedImage,
        stage.backgroundImage,
      ]) {
        if (src) new Image().src = src;
      }
    }
  }, [stepRecipe]);
  const inventory = useMemo(() => {
    if (!me) return [];

    return Object.entries(me.inventory).flatMap(([id, count]) => {
      const ingredient = ingredients.find((entry) => entry.id === Number(id));
      return ingredient ? Array.from({ length: count }, () => ingredient) : [];
    });
  }, [me]);

  // Keep shared progress in sync as each gesture stage finishes. Wait for the
  // server to acknowledge each finish before sending another; recipe completion
  // (including the test button) also drains any remaining stages this way.
  const serverRecipe = me?.recipeIndex;
  const serverStage = me?.recipeStageIndex;
  useEffect(() => {
    if (
      frozen ||
      connection.results ||
      serverRecipe === undefined ||
      serverStage === undefined
    )
      return;
    if (advanceTo !== null && serverRecipe >= advanceTo) {
      setAdvanceTo(null);
      sentFinishFor.current = null;
      return;
    }
    const finishingRecipe = advanceTo !== null && serverRecipe < advanceTo;
    const finishingStage =
      serverRecipe === recipeState && serverStage < activeStageIndex;
    if (!finishingRecipe && !finishingStage) return;

    const key = `${serverRecipe}:${serverStage}`;
    if (sentFinishFor.current === key) return;
    sentFinishFor.current = key;
    connection.socketRef.current?.emit("finish_stage");
  }, [
    frozen,
    connection.results,
    activeStageIndex,
    advanceTo,
    recipeState,
    serverRecipe,
    serverStage,
    connection.socketRef,
  ]);

  function checkoutFromStore(inv: Ingredient[]) {
    if (frozen || connection.results) return;
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

    const stageIndex = Math.max(0, activeStageIndex);
    setCanPrepareRecipe(
      consumedStages.current.has(`${recipeState}:${stageIndex}`) ||
        hasIngredientsForStage(recipeState, stageIndex, inv),
    );
    setInterfaceState("recipe");
  }

  function syncCart(cart: Ingredient[]) {
    if (frozen || connection.results) return;
    const itemCounts = new Map<number, number>();
    for (const ingredient of cart) {
      itemCounts.set(ingredient.id, (itemCounts.get(ingredient.id) ?? 0) + 1);
    }
    connection.socketRef.current?.emit(
      "update_cart",
      Array.from(itemCounts, ([id, count]) => ({ id, count })),
    );
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
    if (frozen || connection.results) return;
    // Tracing and the test button can both land here; count each recipe once.
    if (completedRecipes.current.has(recipeState)) return;
    completedRecipes.current.add(recipeState);

    // Target by our own count so a server that's still catching up isn't under-shot.
    setAdvanceTo(recipeState + 1);

    if (recipeState + 1 < recipeOrder.length) {
      // Next recipe starts from scratch: new card, then back to the store.
      setRecipeState(recipeState + 1);
      setActiveStageIndex(-1);
      setCanPrepareRecipe(false);
      setCurrentPoints([]);
      setShowNewRecipe(true);
    } else {
      setFinished(true);
    }
  }

  useEffect(() => {
    // Consume only after the server has advanced to this stage, so the previous
    // stage's completion cannot re-arm a deadline after consumption clears it.
    if (
      frozen ||
      connection.results ||
      activeStageIndex < 0 ||
      serverRecipe !== recipeState ||
      serverStage !== activeStageIndex
    )
      return;

    const stageKey = `${recipeState}:${activeStageIndex}`;
    if (consumedStages.current.has(stageKey)) return;

    const ingredientsConsumed = recipeOrder
      .at(recipeState)
      ?.stages.at(activeStageIndex)?.ingredientsConsumed;
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
    frozen,
    connection.results,
    activeStageIndex,
    connection.socketRef,
    inventory,
    recipeOrder,
    recipeState,
    serverRecipe,
    serverStage,
  ]);

  const total = recipeOrder.length;
  const recipesDone = recipeState + (finished ? 1 : 0);
  const progress = total ? Math.round((recipesDone / total) * 100) : 0;
  const myPoints = me?.score ?? 0;

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
              ...paper(24, 0),
              background: "#fff",
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

  const recipe = recipeOrder.at(recipeState);
  // An unused ingredient can disappear through steal/trash while cooking.
  // Already-consumed stages remain valid; future stages must still have their ingredients.
  const ready =
    canPrepareRecipe &&
    !finished &&
    recipe &&
    (consumedStages.current.has(
      `${recipeState}:${Math.max(0, activeStageIndex)}`,
    ) ||
      hasIngredientsForStage(recipeState, Math.max(0, activeStageIndex)));
  const activeStage =
    stepRecipe && activeStageIndex >= 0
      ? stepRecipe.stages.at(activeStageIndex)
      : undefined;
  const activeStep =
    recipe && activeStage
      ? stepInfo(recipe.name, activeStageIndex, activeStage)
      : undefined;
  const stageProgress = recipe
    ? stepProgress(recipe, activeStageIndex)
    : undefined;

  if (showNewRecipe && recipe) {
    return (
      <NewRecipeCard
        recipe={recipe}
        number={recipeState + 1}
        total={total}
        onContinue={() => {
          setShowNewRecipe(false);
          setInterfaceState("store");
        }}
      />
    );
  }

  const countdownOverlay = showCountdown && (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        // Solid: nothing of the store shows until the countdown is over.
        background: "#3D2817",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
        padding: 24,
        boxSizing: "border-box",
        textAlign: "center",
      }}
    >
      <div
        style={{
          ...paper(18, 2),
          background: CARD_BG,
          padding: "6px 24px",
          font: lilita(32, 1.2),
          color: INK,
          transform: "rotate(-2deg)",
        }}
      >
        Get ready!
      </div>
      <Countdown cardWidth={110} onDone={() => setShowCountdown(false)} />
      <div style={{ font: nunito(800, 17), color: CARD_BG, maxWidth: 280 }}>
        Your first order is on the big screen. Look up!
      </div>
    </div>
  );

  const testFinishButton = SHOW_TEST_CONTROLS && recipe && !finished && (
    <button
      type="button"
      onClick={completeRecipe}
      style={{
        position: "fixed",
        // Store: top left, beside the sabotage button. Recipe view: bottom right,
        // clear of the top bar, which moves up on short screens.
        ...(interfaceState === "store"
          ? { top: 8, left: 8 }
          : { bottom: 12, right: 12 }),
        zIndex: 70,
        background: "rgba(255,255,255,.9)",
        border: `3px dashed ${INK}`,
        borderRadius: 20,
        padding: "5px 16px",
        font: nunito(900, 12),
        color: INK,
        cursor: "pointer",
      }}
    >
      Test: finish recipe
    </button>
  );

  // The store stays hidden during the countdown, then slides up into view.
  const revealStyle: React.CSSProperties = showCountdown
    ? { visibility: "hidden" }
    : { animation: "storeReveal 600ms cubic-bezier(.2,1,.35,1) both" };
  const revealKeyframes = (
    <style>{`@keyframes storeReveal { from { opacity: 0; transform: translateY(40px) scale(.96); } to { opacity: 1; transform: none; } } @media (prefers-reduced-motion: reduce) { @keyframes storeReveal { from { opacity: 0; } to { opacity: 1; } } }`}</style>
  );

  if (interfaceState == "store") {
    return (
      <>
        {revealKeyframes}
        <div style={revealStyle}>
          <Store
            blackout={connection.sabotages.blackoutMs > 0}
            disabled={frozen}
            uploadInventory={checkoutFromStore}
            onCartChange={syncCart}
            score={myPoints}
            progress={progress}
            notice={total === 0 ? "Waiting for the recipes…" : undefined}
            hint="Look up to see your shopping list"
          />
        </div>
        {testFinishButton}
        {countdownOverlay}
      </>
    );
  }

  // Fit the column to the screen: top bar, cart, recipe title, then the card.
  const compact = viewport.height < 760;
  const topBarTop = compact ? 12 : 58;
  const contentTop = topBarTop + 66 + 10;
  const cardHeight = 324;
  const titleHeight = 58;
  const gaps = 14 * 3 + 16;
  const cartHeight = Math.max(
    70,
    Math.min(
      ready ? 170 : 230,
      viewport.height - contentTop - cardHeight - titleHeight - gaps,
    ),
  );

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
          paddingTop: contentTop,
          paddingBottom: 16,
          boxSizing: "border-box",
          // Last resort on very short screens: scroll rather than clip.
          overflowY: "auto",
        }}
      >
        <PhoneTopBar
          mood={finished ? "delighted" : ready ? "focused" : "worried"}
          progress={progress}
          score={myPoints}
          top={topBarTop}
        />

        <Basket
          items={inventory.map(iconIdFor)}
          width={Math.min(354, viewport.width - 24)}
          height={cartHeight}
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
            ...paper(34, 1),
            background: CARD_BG,
            padding: "12px 16px 14px",
            minWidth: 260,
            minHeight: ready ? undefined : 300,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {ready && stepRecipe && activeStage && stageProgress && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  font: nunito(900, 13),
                  letterSpacing: ".14em",
                  opacity: 0.75,
                }}
              >
                STEP {stageProgress.label} OF {stageProgress.total}
              </div>
              <div style={{ font: lilita(26, 1.1) }}>{activeStep?.label}</div>
            </div>
          )}
          {finished ? (
            <div
              style={{
                ...paper(26, 2),
                background: LEAF,
                padding: "10px 22px",
                font: lilita(32),
              }}
            >
              All recipes done!
            </div>
          ) : ready && stepRecipe ? (
            // Stage gestures use 0–200px coordinates from the top-left of the
            // recipe box, so show that corner and put the finger tracker on the
            // same origin (as on main). Real pixels: no scaling here.
            <div
              style={{
                position: "relative",
                width: GESTURE_AREA,
                height: GESTURE_AREA,
                // A utensil (e.g. whisk) replaces the pointer on some steps.
                cursor: activeStep?.tool ? "none" : undefined,
                overflow: "hidden",
                borderRadius: 22,
                background: "#FFF6E3",
              }}
            >
              <MasterRecipe
                paused={frozen}
                recipe={stepRecipe}
                initialStageIndex={Math.max(0, activeStageIndex)}
                points={currentPoints}
                onStageChange={setActiveStageIndex}
                onCompleteChange={(complete) => {
                  if (complete) completeRecipe();
                }}
              />
              <CursorPathTracker
                disabled={frozen}
                onPointsChange={setCurrentPoints}
              />
              {activeStep?.tool && activeStage && (
                <ToolCursor
                  key={activeStep.tool.src}
                  tool={activeStep.tool}
                  rest={toolRest(activeStage)}
                />
              )}
            </div>
          ) : (
            recipe && (
              <div
                style={{
                  maxWidth: 260,
                  textAlign: "center",
                  background: "#FFE1DA",
                  ...paper(22, 22),
                  padding: "14px 18px",
                  font: nunito(900, 18),
                }}
              >
                You're missing ingredients for this recipe. Tap the store to
                grab them.
              </div>
            )
          )}
          {ready && activeStage && (
            <div style={{ font: nunito(800, 16) }}>
              {gestureHint(activeStage)}
            </div>
          )}
        </div>
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

      {testFinishButton}
      {countdownOverlay}
    </div>
  );
}
