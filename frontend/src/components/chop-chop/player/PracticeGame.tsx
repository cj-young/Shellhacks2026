import { useEffect, useReducer, useState } from "react";
import type React from "react";
import {
  CARD_BG,
  DOT,
  INK,
  ROYAL,
  SUN,
  Sparkle,
  TOMATO,
  lilita,
  nunito,
} from "../design";
import { IngredientIcon } from "../IngredientIcon";
import { COUNTER_BG, GameIcon, GreenPill, PhoneShell } from "../race";
import {
  ChopScreen,
  PlatingScreen,
  RobbedScreen,
  STORE_PAGE_SIZE,
  StoreScreen,
  StoveScreen,
} from "../screens/RacePhoneScreens";
import {
  RECIPES,
  SHELVES,
  dishAsset,
  ingredientName,
  shelfItems,
} from "#/data/menu";
import type { MenuRecipe, RecipeStep } from "#/data/menu";

import { paper } from "#/components/chop-chop/paper";
/** Shelves split into pages that fit the store screen (3 shelves of up to 3). */
export const AISLES: { name: string; items: string[] }[] = SHELVES.flatMap(
  (shelf) => {
    const items = shelfItems(shelf.id);
    const pages: { name: string; items: string[] }[] = [];
    for (let i = 0; i < items.length; i += STORE_PAGE_SIZE)
      pages.push({
        name: shelf.name.toUpperCase(),
        items: items.slice(i, i + STORE_PAGE_SIZE),
      });
    return pages;
  },
);

const RECIPES_PER_ROUND = 3;
const THIEF = { name: "Jun", color: TOMATO };
const BASKET_SIZE = 6;
const CHOPS_PER_ITEM = 3;
const STIR_RADIANS = Math.PI * 3;
const POINTS = { chop: 50, cook: 100, serve: 300 };

type State = {
  /** Indexes into RECIPES for this round. */
  order: number[];
  round: number;
  phase: "intro" | "store" | "cook" | "done";
  aisle: number;
  basket: string[];
  /** Ingredients already chopped or in the pan. */
  used: string[];
  step: number;
  /** Chops landed, radians stirred, or flips made on the current step. */
  effort: number;
  score: number;
  notice?: string;
  robbery?: { before: string[]; index: number };
  robbed: boolean;
};

type Action =
  | { type: "start" }
  | { type: "aisle"; step: 1 | -1 }
  | { type: "take"; slot: number }
  | { type: "putBack"; index: number }
  | { type: "trash" }
  | { type: "leaveStore" }
  | { type: "goStore" }
  | { type: "chop" }
  | { type: "stir"; delta: number }
  | { type: "flip" }
  | { type: "serve" }
  | { type: "steal"; index: number }
  | { type: "robberyOver" }
  | { type: "restart" };

const roundStartingAt = (first: number) =>
  Array.from(
    { length: RECIPES_PER_ROUND },
    (_, i) => (first + i) % RECIPES.length,
  );

const freshRecipe = {
  phase: "intro" as const,
  aisle: 0,
  basket: [],
  used: [],
  step: 0,
  effort: 0,
  notice: undefined,
};

const initialState: State = {
  order: roundStartingAt(0),
  round: 0,
  score: 0,
  robbed: false,
  ...freshRecipe,
};

const recipeOf = (s: State): MenuRecipe => RECIPES[s.order[s.round]];
const choppedIn = (r: MenuRecipe) =>
  r.steps
    .filter((st) => st.gesture === "chop")
    .map((st) => st.ingredient ?? "");
/** Ingredients that go into the pan whole at the first stir/flip. */
const panIngredients = (r: MenuRecipe) =>
  r.ingredients.filter((k) => !choppedIn(r).includes(k));
const names = (ids: string[]) =>
  ids.map((k) => ingredientName(k).toLowerCase()).join(", ");

function without(list: string[], remove: string[]) {
  const out = [...list];
  for (const k of remove) {
    const i = out.indexOf(k);
    if (i !== -1) out.splice(i, 1);
  }
  return out;
}

/** What the current step still needs from the basket. */
function needsForStep(s: State): string[] {
  const r = recipeOf(s);
  const step = r.steps[s.step];
  if (step.gesture === "chop")
    return step.ingredient && !s.used.includes(step.ingredient)
      ? [step.ingredient]
      : [];
  if (step.gesture === "plate") return [];
  return panIngredients(r).filter((k) => !s.used.includes(k));
}

/** Checks the step can go ahead; stir/flip steps load the pan from the basket first. */
function enterStep(s: State): State {
  const step = recipeOf(s).steps[s.step];
  const needs = needsForStep(s);
  const missing = needs.filter((k) => !s.basket.includes(k));
  if (missing.length > 0) {
    return {
      ...s,
      notice: `No ${names(missing)} in your basket! Tap the store to grab more.`,
    };
  }
  if (step.gesture === "stir" || step.gesture === "flip") {
    return {
      ...s,
      basket: without(s.basket, needs),
      used: [...s.used, ...needs],
      notice: undefined,
    };
  }
  return { ...s, notice: undefined };
}

function advance(s: State, points: number): State {
  return enterStep({
    ...s,
    step: s.step + 1,
    effort: 0,
    score: s.score + points,
  });
}

const blocked = (s: State) =>
  needsForStep(s).some((k) => !s.basket.includes(k));

function reducer(s: State, a: Action): State {
  const r = recipeOf(s);
  const step: RecipeStep | undefined = r.steps[s.step];
  switch (a.type) {
    case "start":
      return { ...s, phase: "store" };
    case "aisle":
      return {
        ...s,
        aisle: (s.aisle + a.step + AISLES.length) % AISLES.length,
        notice: undefined,
      };
    case "take": {
      const kind = AISLES[s.aisle].items.at(a.slot);
      if (!kind || s.basket.includes(kind)) return s;
      if (s.basket.length >= BASKET_SIZE)
        return { ...s, notice: "Basket is full! Tap an item to put it back." };
      return { ...s, basket: [...s.basket, kind], notice: undefined };
    }
    case "putBack":
      return {
        ...s,
        basket: s.basket.filter((_, i) => i !== a.index),
        notice: undefined,
      };
    case "trash":
      return {
        ...s,
        basket: step?.gesture === "plate" ? [] : s.basket.slice(0, -1),
      };
    case "leaveStore": {
      const missing = r.ingredients.filter(
        (k) => !s.used.includes(k) && !s.basket.includes(k),
      );
      if (missing.length > 0)
        return { ...s, notice: `Missing: ${names(missing)}` };
      return enterStep({ ...s, phase: "cook" });
    }
    case "goStore":
      return { ...s, phase: "store", notice: undefined };
    case "chop": {
      if (step?.gesture !== "chop" || blocked(s)) return s;
      const effort = s.effort + 1;
      if (effort < CHOPS_PER_ITEM) return { ...s, effort };
      const item = step.ingredient ?? "";
      return advance(
        { ...s, basket: without(s.basket, [item]), used: [...s.used, item] },
        POINTS.chop,
      );
    }
    case "stir": {
      if (step?.gesture !== "stir" || blocked(s)) return s;
      const effort = s.effort + a.delta;
      return Math.abs(effort) < STIR_RADIANS
        ? { ...s, effort }
        : advance(s, POINTS.cook);
    }
    case "flip":
      if (step?.gesture !== "flip" || blocked(s)) return s;
      return advance(s, POINTS.cook);
    case "serve": {
      if (step?.gesture !== "plate") return s;
      const score = s.score + POINTS.serve;
      if (s.round + 1 < s.order.length)
        return { ...s, ...freshRecipe, round: s.round + 1, score };
      return { ...s, phase: "done", score };
    }
    case "steal":
      return {
        ...s,
        robbed: true,
        robbery: { before: s.basket, index: a.index },
      };
    case "robberyOver": {
      if (!s.robbery) return s;
      const index = s.robbery.index;
      return enterStep({
        ...s,
        basket: s.basket.filter((_, i) => i !== index),
        robbery: undefined,
      });
    }
    case "restart":
      return {
        ...initialState,
        order: roundStartingAt(
          (s.order[0] + RECIPES_PER_ROUND) % RECIPES.length,
        ),
      };
  }
}

function progressOf(s: State): number {
  const r = recipeOf(s);
  if (s.phase === "intro") return 0;
  if (s.phase === "done") return 100;
  if (s.phase === "store") {
    const have = r.ingredients.filter(
      (k) => s.used.includes(k) || s.basket.includes(k),
    ).length;
    return Math.round((20 * have) / r.ingredients.length);
  }
  const step = r.steps[s.step];
  const cookingSteps = r.steps.length - 1;
  if (step.gesture === "plate") return 94;
  const frac =
    step.gesture === "chop"
      ? s.effort / CHOPS_PER_ITEM
      : step.gesture === "stir"
        ? Math.abs(s.effort) / STIR_RADIANS
        : 0;
  return Math.round(20 + (74 * (s.step + Math.min(1, frac))) / cookingSteps);
}

export function PracticeGame() {
  const [s, dispatch] = useReducer(reducer, initialState);
  const [lifted, setLifted] = useState(false);
  const r = recipeOf(s);
  const step = r.steps.at(s.step);
  const progress = progressOf(s);

  // The thief strikes once, on the first recipe after its first step, taking something still needed.
  useEffect(() => {
    if (s.robbed || s.phase !== "cook" || s.round !== 0 || s.step < 1) return;
    const target = s.basket.findIndex(
      (k) => r.ingredients.includes(k) && !s.used.includes(k),
    );
    if (target === -1) return;
    const id = setTimeout(
      () => dispatch({ type: "steal", index: target }),
      800,
    );
    return () => clearTimeout(id);
  }, [s.robbed, s.phase, s.round, s.step, s.basket, s.used, r]);

  useEffect(() => {
    if (!s.robbery) return;
    const id = setTimeout(() => dispatch({ type: "robberyOver" }), 2600);
    return () => clearTimeout(id);
  }, [s.robbery]);

  const flip = () => {
    dispatch({ type: "flip" });
    setLifted(true);
    setTimeout(() => setLifted(false), 220);
  };

  const common = { framed: false, score: s.score, progress };

  if (s.robbery) {
    return (
      <RobbedScreen
        {...common}
        basket={s.robbery.before}
        goneIndex={s.robbery.index}
        thief={THIEF}
        panItem={s.used.at(0) ?? r.ingredients[0]}
      />
    );
  }

  if (s.phase === "intro") {
    return (
      <RecipeCard
        recipe={r}
        index={s.round}
        total={s.order.length}
        onStart={() => dispatch({ type: "start" })}
      />
    );
  }

  if (s.phase === "done") {
    return (
      <Results
        score={s.score}
        served={s.order.length}
        onRestart={() => dispatch({ type: "restart" })}
      />
    );
  }

  if (s.phase === "store") {
    const aisle = AISLES[s.aisle];
    return (
      <StoreScreen
        {...common}
        aisleName={aisle.name}
        aisleIndex={s.aisle}
        aisleCount={AISLES.length}
        shelf={aisle.items.map((kind) =>
          s.basket.includes(kind) ? null : { kind },
        )}
        basket={s.basket}
        notice={s.notice}
        onPrevAisle={() => dispatch({ type: "aisle", step: -1 })}
        onNextAisle={() => dispatch({ type: "aisle", step: 1 })}
        onTake={(slot) => dispatch({ type: "take", slot })}
        onBasketTap={(index) => dispatch({ type: "putBack", index })}
        onTrash={() => dispatch({ type: "trash" })}
        onLeave={() => dispatch({ type: "leaveStore" })}
      />
    );
  }

  const goStore = () => dispatch({ type: "goStore" });

  if (step?.gesture === "chop") {
    const chopSteps = r.steps.filter((st) => st.gesture === "chop");
    return (
      <ChopScreen
        {...common}
        basket={s.basket}
        queue={chopSteps.map((st) => st.ingredient ?? "")}
        current={chopSteps.indexOf(step)}
        chops={s.effort}
        notice={s.notice}
        onChop={() => dispatch({ type: "chop" })}
        onStore={goStore}
      />
    );
  }

  const gesture = step?.gesture;
  if (gesture === "stir" || gesture === "flip") {
    return (
      <StoveScreen
        {...common}
        basket={s.basket}
        panItems={[...s.used].reverse()}
        gesture={gesture}
        turn={gesture === "stir" ? s.effort : 0}
        lifted={lifted}
        notice={s.notice}
        onStir={
          gesture === "stir"
            ? (delta) => dispatch({ type: "stir", delta })
            : undefined
        }
        onFlip={gesture === "flip" ? flip : undefined}
        onStore={goStore}
      />
    );
  }

  return (
    <PlatingScreen
      {...common}
      basket={s.basket}
      dish={r.id}
      onServe={() => dispatch({ type: "serve" })}
      onTrash={() => dispatch({ type: "trash" })}
      onStore={goStore}
    />
  );
}

const sectionLabel: React.CSSProperties = {
  font: nunito(900, 15),
  letterSpacing: ".14em",
};

function StepIcon({ step, recipeId }: { step: RecipeStep; recipeId: string }) {
  if (step.gesture === "plate") {
    return <img src={dishAsset(recipeId)} alt="" width={36} height={36} />;
  }
  return <GameIcon kind={step.gesture} size={32} sticker={false} />;
}

/** In a real game this card lives on the host screen; practice shows it on the phone. */
export function RecipeCard({
  recipe,
  index,
  total,
  onStart,
  framed = false,
}: {
  recipe: MenuRecipe;
  index: number;
  total: number;
  onStart?: () => void;
  framed?: boolean;
}) {
  return (
    <PhoneShell framed={framed} background={COUNTER_BG}>
      <div
        style={{
          position: "absolute",
          top: 58,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <div style={sectionLabel}>
          RECIPE {index + 1} OF {total}
        </div>
        <div style={{ font: lilita(38, 1.1), marginTop: 6 }}>{recipe.name}</div>
      </div>

      <div
        style={{
          ...paper(34, 0),
          position: "absolute",
          top: 150,
          left: 22,
          right: 22,
          background: CARD_BG,
          boxSizing: "border-box",
          padding: "16px 18px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <span style={sectionLabel}>GRAB THESE</span>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
        >
          {recipe.ingredients.map((kind) => (
            <div
              key={kind}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <IngredientIcon id={kind} size={50} />
              <span style={{ font: nunito(900, 15) }}>
                {ingredientName(kind)}
              </span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `3px dashed ${DOT}`, marginTop: 2 }} />
        <span style={sectionLabel}>THEN</span>
        {recipe.steps.map((step, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <span
              style={{ width: 20, font: lilita(22, 1), textAlign: "right" }}
            >
              {i + 1}
            </span>
            <div
              style={{
                ...paper("50%", 1),
                width: 44,
                height: 44,
                flexShrink: 0,
                background: "#fff",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <StepIcon step={step} recipeId={recipe.id} />
            </div>
            <span style={{ font: lilita(24, 1.1) }}>{step.label}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: 30,
          right: 30,
          bottom: 126,
          textAlign: "center",
          font: nunito(800, 15),
        }}
      >
        Practice round. In a real game this card is on the big screen, so
        memorize it!
      </div>

      <GreenPill
        onClick={onStart}
        streak={{ left: 32, width: 44 }}
        style={{
          left: 22,
          right: 22,
          bottom: 30,
          height: 78,
          borderRadius: 39,
          font: lilita(40),
        }}
      >
        Start cooking ›
      </GreenPill>
    </PhoneShell>
  );
}

function Results({
  score,
  served,
  onRestart,
}: {
  score: number;
  served: number;
  onRestart: () => void;
}) {
  return (
    <PhoneShell framed={false} background={COUNTER_BG}>
      <Sparkle
        kind="star"
        color={SUN}
        size={44}
        rotate={12}
        style={{ position: "absolute", left: 36, top: 90 }}
      />
      <Sparkle
        kind="plus"
        color="#F7876B"
        size={26}
        style={{ position: "absolute", right: 46, top: 120 }}
      />
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 0,
          right: 0,
          textAlign: "center",
          font: lilita(56, 1),
          color: SUN,
          WebkitTextStroke: `9px ${INK}`,
          paintOrder: "stroke fill",
          textShadow: `0 6px 0 ${INK}`,
        }}
      >
        Kitchen closed!
      </div>

      <div
        style={{
          ...paper(36, 2),
          position: "absolute",
          top: 250,
          left: "50%",
          transform: "translateX(-50%) rotate(-3deg)",
          background: SUN,
          padding: "14px 48px 18px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <span style={{ font: nunito(900, 20), letterSpacing: ".14em" }}>
          SCORE
        </span>
        <span style={{ font: lilita(96, 1) }}>{score}</span>
      </div>

      <div
        style={{
          position: "absolute",
          top: 470,
          left: 0,
          right: 0,
          textAlign: "center",
          font: nunito(900, 22),
        }}
      >
        {served} of {served} dishes served
      </div>

      <GreenPill
        onClick={onRestart}
        streak={{ left: 32, width: 44 }}
        style={{
          left: 22,
          right: 22,
          bottom: 110,
          height: 78,
          borderRadius: 39,
          font: lilita(40),
        }}
      >
        Play again
      </GreenPill>
      <a
        href="/"
        style={{
          position: "absolute",
          bottom: 48,
          left: 0,
          right: 0,
          textAlign: "center",
          font: nunito(800, 17),
          color: ROYAL,
        }}
      >
        Back to menu
      </a>
    </PhoneShell>
  );
}
