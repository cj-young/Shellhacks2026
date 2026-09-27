import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type { Recipe, RecipeStage } from "#/lib/types";
import ingredients from "#/data/ingredients.json";
import { menuIngredientIdFor } from "#/data/menu";
import {
  gestureHint,
  menuRecipeIdFor,
  stepInfo,
  stepTableLength,
  withStepArt,
} from "#/data/recipe-steps";
import { MasterRecipe } from "#/components/MasterRecipe";
import { CursorPathTracker } from "#/components/CursorPathTracker";
import type { CursorPoint } from "#/components/CursorPathTracker";
import { ToolCursor, toolRest } from "#/components/client/ToolCursor";
import {
  CARD_BG,
  INK,
  LEAF,
  PAGE_BG,
  SUN,
  TOMATO,
  lilita,
  nunito,
} from "#/components/chop-chop/design";
import { paper } from "#/components/chop-chop/paper";

/** Same visible gesture square as the phone (ClientInterface). */
const GESTURE_AREA = 210;

type Level = "ok" | "warn" | "error";
type Check = { level: Level; text: string };

/* ------------------------------ Loading recipes ----------------------------- */

const once = <T,>(socket: Socket, event: string, ms = 8000) =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out waiting for "${event}"`)),
      ms,
    );
    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });

/**
 * The phone only receives recipes when a game starts, so host a throwaway game,
 * join it, start it and take the recipe order the server sends (all recipes).
 */
/**
 * A game only gets a random few recipes, so keep starting throwaway games
 * until a few in a row turn up nothing new; that collects every recipe.
 */
async function loadAllRecipes(): Promise<Recipe[]> {
  const byName = new Map<string, Recipe>();
  let quiet = 0;
  for (let game = 0; game < 12 && quiet < 3; game++) {
    const before = byName.size;
    for (const r of await loadRecipesFromServer()) byName.set(r.name, r);
    quiet = byName.size > before ? 0 : quiet + 1;
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function loadRecipesFromServer(): Promise<Recipe[]> {
  const res = await fetch("/api/games", { method: "POST" });
  if (!res.ok) throw new Error(`Creating a game failed (${res.status})`);
  const { code, hostToken } = (await res.json()) as {
    code: string;
    hostToken: string;
  };
  const connect = (auth: Record<string, string>) =>
    io({ path: "/api/socket.io/", auth });

  const host = connect({ code, token: hostToken, name: "Walkthrough host" });
  const player = connect({ code, name: "Walkthrough" });
  try {
    await Promise.all([once(host, "joined"), once(player, "joined")]);
    const started = new Promise<Recipe[]>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("The game started without recipes")),
        8000,
      );
      player.on("update_state", (state: { recipeOrder?: Recipe[] }) => {
        if (state.recipeOrder?.length) {
          clearTimeout(timer);
          resolve(state.recipeOrder);
        }
      });
      player.on("game_error", (e: { message?: string }) =>
        reject(new Error(e.message ?? "Game error")),
      );
    });
    host.emit("start_game");
    const order = await started;
    return [...order].sort((a, b) => a.name.localeCompare(b.name));
  } finally {
    host.disconnect();
    player.disconnect();
  }
}

/* ---------------------------------- Checks ---------------------------------- */

const ingredientName = (id: number) =>
  ingredients.find((i) => i.id === id)?.name ?? `#${id}`;

function stageChecks(stage: RecipeStage): Check[] {
  const checks: Check[] = [];
  const fits = (lo: number, hi: number) => lo >= 0 && hi <= GESTURE_AREA;
  if (stage.type === "spin") {
    if (stage.spins.length === 0)
      checks.push({ level: "error", text: "Spin stage has no spins" });
    stage.spins.forEach((s, i) => {
      const reach = s.radius + s.tolerance;
      if (s.tolerance >= s.radius)
        checks.push({
          level: "error",
          text: `Spin ${i + 1}: tolerance (${s.tolerance}) must be less than radius (${s.radius})`,
        });
      if (
        !fits(s.center.x - reach, s.center.x + reach) ||
        !fits(s.center.y - reach, s.center.y + reach)
      )
        checks.push({
          level: "warn",
          text: `Spin ${i + 1}: ring reaches past the ${GESTURE_AREA}px gesture area`,
        });
      if (s.rotations < 1)
        checks.push({
          level: "error",
          text: `Spin ${i + 1}: rotations must be at least 1`,
        });
    });
  } else {
    if (stage.lines.length === 0)
      checks.push({ level: "error", text: "Lines stage has no lines" });
    stage.lines.forEach((l, i) => {
      const xs = [l.start.x, l.end.x];
      const ys = [l.start.y, l.end.y];
      if (
        !fits(Math.min(...xs) - l.radius, Math.max(...xs) + l.radius) ||
        !fits(Math.min(...ys) - l.radius, Math.max(...ys) + l.radius)
      )
        checks.push({
          level: "warn",
          text: `Line ${i + 1}: reaches past the ${GESTURE_AREA}px gesture area`,
        });
      if (Math.hypot(l.end.x - l.start.x, l.end.y - l.start.y) < 10)
        checks.push({
          level: "warn",
          text: `Line ${i + 1}: very short (under 10px)`,
        });
    });
  }
  for (const id of Object.keys(stage.ingredientsConsumed ?? {}).map(Number)) {
    if (!ingredients.some((i) => i.id === id))
      checks.push({ level: "error", text: `Uses unknown ingredient id ${id}` });
  }
  return checks;
}

function recipeChecks(recipe: Recipe): Check[] {
  const checks: Check[] = [];
  const table = stepTableLength(recipe.name);
  if (table === undefined)
    checks.push({
      level: "warn",
      text: "No entry in recipe-steps.json: steps get generic names",
    });
  else if (table !== recipe.stages.length)
    checks.push({
      level: "error",
      text: `recipe-steps.json has ${table} steps but the recipe has ${recipe.stages.length}: names after the first mismatch are wrong`,
    });
  else
    checks.push({ level: "ok", text: `Step names cover all ${table} steps` });

  checks.push(
    menuRecipeIdFor(recipe.name)
      ? { level: "ok", text: "Finished-dish art found" }
      : { level: "warn", text: "No dish art matches this recipe name" },
  );

  // What the steps use up vs. what the shopping list asks players to buy.
  const used = new Map<number, number>();
  for (const stage of recipe.stages)
    for (const [id, n] of Object.entries(stage.ingredientsConsumed ?? {}))
      used.set(Number(id), (used.get(Number(id)) ?? 0) + n);
  for (const { id, count } of recipe.ingredients) {
    const name = ingredientName(id);
    const u = used.get(id) ?? 0;
    if (u > count)
      checks.push({
        level: "error",
        text: `${name}: steps use ${u} but the shopping list only asks for ${count}`,
      });
    else if (u === 0)
      checks.push({
        level: "warn",
        text: `${name}: on the shopping list but no step uses it`,
      });
    if (!menuIngredientIdFor(name))
      checks.push({
        level: "warn",
        text: `${name}: no ingredient art (shows the team's placeholder)`,
      });
  }
  for (const [id, u] of used)
    if (!recipe.ingredients.some((i) => i.id === id))
      checks.push({
        level: "error",
        text: `${ingredientName(id)}: used ${u}× by steps but not on the shopping list`,
      });
  return checks;
}

/** Tries to load each picture; returns ok/broken per path. */
function useImageStatus(paths: string[]) {
  const [status, setStatus] = useState<Record<string, "ok" | "broken">>({});
  const key = paths.join("|");
  useEffect(() => {
    let alive = true;
    for (const src of new Set(paths)) {
      const img = new Image();
      img.onload = () => alive && setStatus((s) => ({ ...s, [src]: "ok" }));
      img.onerror = () =>
        alive && setStatus((s) => ({ ...s, [src]: "broken" }));
      img.src = src;
    }
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return status;
}

/* ----------------------------------- Page ----------------------------------- */

const LEVEL_COLOR: Record<Level, string> = {
  ok: LEAF,
  warn: SUN,
  error: TOMATO,
};
const LEVEL_MARK: Record<Level, string> = { ok: "✓", warn: "!", error: "✕" };

function Badge({ level }: { level: Level }) {
  return (
    <span
      style={{
        ...paper("50%", 1, false),
        flexShrink: 0,
        width: 22,
        height: 22,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: LEVEL_COLOR[level],
        color: level === "warn" ? INK : "#fff",
        font: nunito(900, 13),
      }}
    >
      {LEVEL_MARK[level]}
    </span>
  );
}

const panel: React.CSSProperties = {
  ...paper(26, 2),
  background: CARD_BG,
  padding: 16,
  boxSizing: "border-box",
};

let cachedRecipes: Promise<Recipe[]> | null = null;
/** One throwaway game per page load, shared by every walkthrough on the page. */
function recipesOnce(reload = false): Promise<Recipe[]> {
  if (reload || !cachedRecipes) {
    cachedRecipes = loadAllRecipes();
    cachedRecipes.catch(() => (cachedRecipes = null));
  }
  return cachedRecipes;
}

const recipeKey = (name: string) => name.toLowerCase().replace(/[^a-z]/g, "");

export function RecipeWalkthrough({
  only,
  embedded = false,
}: {
  /** Show just this recipe (by name, e.g. "Pancakes"), without the tabs. */
  only?: string;
  /** Inside the dev screen switcher: fill the frame instead of the window. */
  embedded?: boolean;
} = {}) {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [error, setError] = useState("");
  const [recipeIndex, setRecipeIndex] = useState(0);

  const load = useCallback((reload = false) => {
    setError("");
    setRecipes(null);
    recipesOnce(reload)
      .then(setRecipes)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : String(e)),
      );
  }, []);
  useEffect(() => load(), [load]);

  const onlyIndex =
    only && recipes
      ? recipes.findIndex((r) => recipeKey(r.name).startsWith(recipeKey(only)))
      : -1;
  const recipe = only ? recipes?.[onlyIndex] : recipes?.[recipeIndex];

  return (
    <div
      style={{
        ...(embedded
          ? { height: "100%", overflowY: "auto" }
          : { minHeight: "100dvh" }),
        background: PAGE_BG,
        color: INK,
        fontFamily: "Nunito, sans-serif",
        padding: "20px 16px 40px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <h1 style={{ margin: 0, font: lilita(34, 1.1) }}>
            {only && recipe ? recipe.name : "Recipe walkthrough"}
          </h1>
          <span style={{ font: nunito(800, 15), opacity: 0.75 }}>
            Real recipes from the server · play each step with your finger or
            mouse
          </span>
          <button
            type="button"
            onClick={() => load(true)}
            style={{
              ...paper(20, 3),
              background: "#fff",
              padding: "6px 14px",
              font: nunito(900, 14),
              marginLeft: "auto",
            }}
          >
            Reload from server
          </button>
        </div>

        {error && (
          <div
            style={{
              ...panel,
              background: "#FFE1DA",
              marginTop: 16,
              font: nunito(800, 16),
            }}
          >
            Couldn't load recipes: {error}. Is the backend running? (docker
            compose restart backend)
          </div>
        )}
        {!recipes && !error && (
          <div style={{ marginTop: 24, font: nunito(800, 18) }}>
            Loading recipes from the server…
          </div>
        )}

        {recipes && only && onlyIndex < 0 && (
          <div style={{ ...panel, marginTop: 16, font: nunito(800, 16) }}>
            The server has no recipe called “{only}”. It has:{" "}
            {recipes.map((r) => r.name).join(", ")}.
          </div>
        )}

        {recipes && !only && (
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              margin: "18px 0",
            }}
          >
            {recipes.map((r, i) => (
              <button
                key={r.name}
                type="button"
                onClick={() => setRecipeIndex(i)}
                style={{
                  ...paper(22, i),
                  background: i === recipeIndex ? SUN : "#fff",
                  padding: "8px 18px",
                  font: lilita(22, 1.1),
                }}
              >
                {r.name} · {r.stages.length} steps
              </button>
            ))}
          </div>
        )}

        {recipe && (
          <div style={{ marginTop: only ? 18 : 0 }}>
            <RecipePlayer key={recipe.name} recipe={recipe} />
          </div>
        )}
      </div>
    </div>
  );
}

function RecipePlayer({ recipe }: { recipe: Recipe }) {
  const decorated = useMemo(() => withStepArt(recipe), [recipe]);
  const stages = decorated.stages;
  const [start, setStart] = useState(0);
  const [run, setRun] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [complete, setComplete] = useState(false);
  const [points, setPoints] = useState<CursorPoint[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const stageStarted = useRef(Date.now());
  const areaRef = useRef<HTMLDivElement>(null);
  // Gestures are in un-scaled px but the tracker reports screen px. When the
  // dev switcher scales this screen down, convert back so gestures still match.
  const onPoints = useCallback((raw: CursorPoint[]) => {
    const el = areaRef.current;
    const scale =
      el && el.offsetWidth
        ? el.getBoundingClientRect().width / el.offsetWidth
        : 1;
    setPoints(
      Math.abs(scale - 1) < 0.001
        ? raw
        : raw.map((p) => ({ ...p, x: p.x / scale, y: p.y / scale })),
    );
  }, []);
  const lastStage = useRef(0);

  const images = useImageStatus(
    stages.flatMap((s) =>
      [s.backgroundImage, s.image, s.finishedImage].filter((x): x is string =>
        Boolean(x),
      ),
    ),
  );
  const perStage = useMemo(() => recipe.stages.map(stageChecks), [recipe]);
  const overall = useMemo(() => recipeChecks(recipe), [recipe]);

  const jump = (to: number) => {
    const i = Math.max(0, Math.min(stages.length - 1, to));
    setStart(i);
    setStageIndex(i);
    setComplete(false);
    setPoints([]);
    setRun((n) => n + 1);
    stageStarted.current = Date.now();
    lastStage.current = i;
  };
  const restart = () => {
    setDone(new Set());
    setLog([]);
    jump(0);
  };

  const onStageChange = useCallback((i: number) => {
    const prev = lastStage.current;
    if (i === -1 || i > prev) {
      const secs = ((Date.now() - stageStarted.current) / 1000).toFixed(1);
      setDone((d) => new Set(d).add(prev));
      setLog((l) => [`Step ${prev + 1} done in ${secs}s`, ...l].slice(0, 30));
      stageStarted.current = Date.now();
    }
    if (i >= 0) {
      lastStage.current = i;
      setStageIndex(i);
    }
  }, []);

  const onComplete = useCallback(
    (c: boolean) => {
      if (!c) return;
      setComplete(true);
      setLog((l) => [`${recipe.name} complete ✓`, ...l]);
    },
    [recipe.name],
  );

  const stage = stages.at(stageIndex);
  const info = stage ? stepInfo(recipe.name, stageIndex, stage) : undefined;
  const dishId = menuRecipeIdFor(recipe.name);

  const stageLevel = (i: number): Level => {
    const s = stages[i];
    const pics = [s.backgroundImage, s.image, s.finishedImage].filter(
      Boolean,
    ) as string[];
    if (
      perStage[i].some((c) => c.level === "error") ||
      pics.some((p) => images[p] === "broken")
    )
      return "error";
    if (perStage[i].some((c) => c.level === "warn")) return "warn";
    return "ok";
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 18,
        flexWrap: "wrap",
        alignItems: "flex-start",
      }}
    >
      {/* Steps */}
      <div style={{ ...panel, flex: "1 1 280px", maxWidth: 360 }}>
        <div
          style={{
            font: nunito(900, 13),
            letterSpacing: ".14em",
            marginBottom: 10,
          }}
        >
          STEPS · TAP TO JUMP
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {stages.map((s, i) => {
            const si = stepInfo(recipe.name, i, s);
            const current = i === stageIndex && !complete;
            return (
              <button
                key={i}
                type="button"
                onClick={() => jump(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: 14,
                  border: "none",
                  background: current ? "#FFE7A0" : "transparent",
                  textAlign: "left",
                  color: INK,
                  font: nunito(800, 14),
                  cursor: "pointer",
                }}
              >
                <Badge level={stageLevel(i)} />
                <span style={{ width: 18, opacity: 0.6 }}>{i + 1}.</span>
                <span style={{ flex: 1 }}>
                  {si.label}
                  <span style={{ opacity: 0.55 }}>
                    {" "}
                    ·{" "}
                    {s.type === "spin"
                      ? "spin"
                      : `${s.lines.length} line${s.lines.length > 1 ? "s" : ""}`}
                  </span>
                </span>
                {done.has(i) && (
                  <span style={{ color: LEAF, font: nunito(900, 16) }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Player: the same gesture area as the phone, at real pixels. */}
      <div
        style={{
          ...panel,
          flex: "0 0 auto",
          width: 300,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        {complete ? (
          <>
            <div style={{ font: lilita(30, 1.1), color: LEAF }}>
              Recipe complete!
            </div>
            {dishId && (
              <img
                src={`/assets/dish-${dishId}.svg`}
                alt=""
                width={180}
                height={180}
              />
            )}
          </>
        ) : (
          <>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  font: nunito(900, 13),
                  letterSpacing: ".14em",
                  opacity: 0.75,
                }}
              >
                STEP {stageIndex + 1} OF {stages.length}
              </div>
              <div style={{ font: lilita(24, 1.1) }}>{info?.label}</div>
            </div>
            <div
              ref={areaRef}
              style={{
                cursor: info?.tool ? "none" : undefined,
                position: "relative",
                width: GESTURE_AREA,
                height: GESTURE_AREA,
                overflow: "hidden",
                borderRadius: 22,
                background: "#FFF6E3",
              }}
            >
              <MasterRecipe
                key={`${recipe.name}:${run}`}
                recipe={decorated}
                initialStageIndex={start}
                points={points}
                onStageChange={onStageChange}
                onCompleteChange={onComplete}
              />
              <CursorPathTracker onPointsChange={onPoints} />
              {info?.tool && stage && (
                <ToolCursor
                  key={info.tool.src}
                  tool={info.tool}
                  rest={toolRest(stage)}
                />
              )}
            </div>
            <div style={{ font: nunito(800, 15), textAlign: "center" }}>
              {gestureHint(stage)}
            </div>
          </>
        )}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={() => jump(stageIndex - 1)}
            style={{
              ...paper(18, 0),
              background: "#fff",
              padding: "6px 12px",
              font: nunito(900, 14),
            }}
          >
            ◀ Back
          </button>
          <button
            type="button"
            onClick={() =>
              stageIndex + 1 < stages.length
                ? jump(stageIndex + 1)
                : onComplete(true)
            }
            style={{
              ...paper(18, 1),
              background: SUN,
              padding: "6px 12px",
              font: nunito(900, 14),
            }}
          >
            Skip step ▶
          </button>
          <button
            type="button"
            onClick={restart}
            style={{
              ...paper(18, 2),
              background: "#fff",
              padding: "6px 12px",
              font: nunito(900, 14),
            }}
          >
            Restart
          </button>
        </div>
        {log.length > 0 && (
          <div
            style={{
              alignSelf: "stretch",
              font: nunito(700, 13),
              opacity: 0.8,
              maxHeight: 120,
              overflowY: "auto",
            }}
          >
            {log.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </div>

      {/* Checks */}
      <div style={{ ...panel, flex: "1 1 300px" }}>
        <div
          style={{
            font: nunito(900, 13),
            letterSpacing: ".14em",
            marginBottom: 10,
          }}
        >
          RECIPE CHECKS
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: 16,
          }}
        >
          {overall.map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                font: nunito(700, 14),
              }}
            >
              <Badge level={c.level} />
              {c.text}
            </div>
          ))}
        </div>
        <div
          style={{
            font: nunito(900, 13),
            letterSpacing: ".14em",
            marginBottom: 10,
          }}
        >
          STEP {stageIndex + 1} CHECKS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {stage &&
            (
              [
                ["Picture", stage.image],
                ["After picture", stage.finishedImage],
                ["Background", stage.backgroundImage],
              ] as const
            ).map(([label, src]) =>
              src ? (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    font: nunito(700, 14),
                  }}
                >
                  <Badge
                    level={
                      images[src] === "broken"
                        ? "error"
                        : images[src] === "ok"
                          ? "ok"
                          : "warn"
                    }
                  />
                  <span style={{ wordBreak: "break-all" }}>
                    {label}: {src}{" "}
                    {images[src] === "broken"
                      ? "(doesn't load)"
                      : images[src]
                        ? ""
                        : "(loading…)"}
                  </span>
                </div>
              ) : null,
            )}
          {perStage[stageIndex]?.length === 0 && (
            <div style={{ display: "flex", gap: 8, font: nunito(700, 14) }}>
              <Badge level="ok" /> Gesture fits the gesture area
            </div>
          )}
          {perStage[stageIndex]?.map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                font: nunito(700, 14),
              }}
            >
              <Badge level={c.level} />
              {c.text}
            </div>
          ))}
          {stage && Object.keys(stage.ingredientsConsumed ?? {}).length > 0 && (
            <div style={{ font: nunito(700, 14), marginTop: 4 }}>
              Uses:{" "}
              {Object.entries(stage.ingredientsConsumed)
                .map(([id, n]) => `${ingredientName(Number(id))} ×${n}`)
                .join(", ")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
