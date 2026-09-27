import { useEffect, useRef, useState } from "react";
import type React from "react";
import type { CSSProperties } from "react";
import type { GameConnection } from "#/lib/use-game-connection";
import definitions from "#/data/sabotages.json";
import ingredients from "#/data/ingredients.json";
import { NOTICE_MS, canTarget, effectRemaining } from "#/lib/sabotages";
import { paper } from "#/components/chop-chop/paper";
import { characterImage } from "#/data/characters";
import { IngredientIcon } from "#/components/chop-chop/IngredientIcon";
import { iconIdFor } from "#/components/client/Store";
import { CARD_BG, INK, lilita, nunito } from "#/components/chop-chop/design";
import "./sabotage.css";

/** Swap these badges and the CSS animations when final sabotage artwork is ready. */
export const SABOTAGE_BADGES: Record<string, string> = {
  steal: "✋",
  trash: "🗑️",
  freeze: "❄️",
  blackout: "💡",
};
const panel: CSSProperties = {
  ...paper(22, 3),
  background: CARD_BG,
  color: INK,
  padding: 16,
  font: nunito(800, 16),
};

/* ---------------------------------------------------------------------------
 * Display pieces. They only take plain props, so the live components below and
 * the dev design sheet (components/dev/SabotageDesignSheet) render the same UI.
 * ------------------------------------------------------------------------- */

export function SabotageLaunchButton({
  credits,
  frozen = false,
  inline = false,
  onClick,
}: {
  credits: number;
  frozen?: boolean;
  /** In the phone top bar instead of pinned to the screen corner. */
  inline?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`sabotage-launch${inline ? " is-inline" : ""}`}
      disabled={frozen}
      onClick={onClick}
    >
      <img
        src="/assets/ingredient-tomato.svg"
        alt=""
        width={22}
        height={22}
        draggable={false}
      />
      Sabotage · {credits}
    </button>
  );
}

/** A timed sabotage's length in seconds, from sabotages.json. */
const seconds = (id: string) =>
  (definitions.find((d) => d.id === id)?.durationMs ?? 0) / 1000;

/** The sabotages players can be awarded, in menu order, with their artwork. */
export const SABOTAGE_CARDS = [
  { id: "trash", blurb: "Toss one of a chef's ingredients" },
  { id: "freeze", blurb: `Freeze a chef for ${seconds("freeze")} seconds` },
  {
    id: "blackout",
    blurb: `Lights out in every store for ${seconds("blackout")}s`,
  },
] as const;
export const sabotageArt = (id: string) => `/assets/sabotages/${id}.png`;
export const sabotageAwardArt = (id: string) =>
  `/assets/sabotages/award-${id}.png`;

export type SabotageTargetOption = {
  id: string;
  name: string;
  connected: boolean;
  /** Chef picked in the lobby, for the avatar. */
  character?: string | null;
  /** What they're up to, e.g. "Shopping" or "Cooking · recipe 2". */
  status: string;
  /** Unused ingredient ids in their inventory (what trash could hit). */
  items: number[];
  /** False when the chosen sabotage can't hit them (e.g. nothing to trash). */
  available: boolean;
};

function Avatar({ option }: { option: SabotageTargetOption }) {
  return (
    <span className="sabotage-avatar">
      {option.character && (
        <img src={characterImage(option.character)} alt="" draggable={false} />
      )}
    </span>
  );
}

/** Contents of the sabotage menu (the live version wraps it in a <dialog>). */
export function SabotageMenu({
  held,
  selected,
  onSelect,
  targets,
  targetId,
  onTarget,
  pending = false,
  frozen = false,
  used = false,
  error,
  onUse,
  onClose,
}: {
  /** Sabotage ids the player holds ("*" = an untyped credit, fits any). */
  held: string[];
  selected: string | null;
  onSelect?: (id: string) => void;
  targets: SabotageTargetOption[];
  targetId: string;
  onTarget?: (id: string) => void;
  pending?: boolean;
  frozen?: boolean;
  /** Show the "Sabotage used!" confirmation. */
  used?: boolean;
  error?: string;
  onUse?: () => void;
  onClose?: () => void;
}) {
  const count = (id: string) =>
    held.filter((h) => h === id).length + held.filter((h) => h === "*").length;
  const definition = definitions.find((entry) => entry.id === selected);
  const owned = Boolean(definition && count(definition.id) > 0);
  const target = targets.find((option) => option.id === targetId);
  const single = definition?.targetScope === "single";
  const ready =
    owned &&
    !pending &&
    !frozen &&
    (!single || Boolean(target?.connected && target.available));

  return (
    <div style={{ ...panel, border: 0, boxShadow: "none" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
        }}
      >
        <h2 id="sabotage-title" style={{ font: lilita(30), margin: 0 }}>
          Kitchen chaos
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sabotage menu"
        >
          ✕
        </button>
      </div>
      <p role="status" style={{ margin: "6px 0 12px" }}>
        {held.length
          ? `You have ${held.length} sabotage${held.length === 1 ? "" : "s"} ready.`
          : "Finish a recipe to earn a sabotage."}
      </p>

      <div className="sabotage-cards">
        {SABOTAGE_CARDS.map((card) => {
          const def = definitions.find((d) => d.id === card.id)!;
          const n = count(card.id);
          return (
            <button
              key={card.id}
              type="button"
              className="sabotage-card"
              aria-pressed={selected === card.id}
              disabled={n === 0}
              onClick={() => onSelect?.(card.id)}
            >
              <img src={sabotageArt(card.id)} alt="" draggable={false} />
              <strong>{def.name}</strong>
              <span>{card.blurb}</span>
              {n > 1 && <em className="sabotage-count">×{n}</em>}
            </button>
          );
        })}
      </div>

      {owned && definition && single && (
        <div role="radiogroup" aria-label="Choose a chef">
          <div className="sabotage-label">CHOOSE A CHEF</div>
          <div className="sabotage-chefs">
            {targets.map((option) => {
              const open = option.connected && option.available && !pending;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={targetId === option.id}
                  className="sabotage-chef"
                  disabled={!open}
                  onClick={() => onTarget?.(option.id)}
                >
                  <Avatar option={option} />
                  <strong>{option.name}</strong>
                  <span className="sabotage-status">
                    {option.connected ? option.status : "Disconnected"}
                  </span>
                  {definition.id === "trash" && option.connected && (
                    <span className="sabotage-items">
                      {option.items.length ? (
                        option.items.map((id, i) => {
                          const ing = ingredients.find((e) => e.id === id);
                          return ing ? (
                            <IngredientIcon
                              key={i}
                              id={iconIdFor(ing)}
                              size={22}
                            />
                          ) : null;
                        })
                      ) : (
                        <em>Nothing to trash</em>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {!targets.length && <p>No other chefs to target yet.</p>}
        </div>
      )}

      {used && <p role="status">Sabotage used!</p>}
      {error && <p role="alert">{error}</p>}
      <button
        className="sabotage-use"
        type="button"
        disabled={!ready}
        onClick={onUse}
      >
        {pending
          ? "Sending…"
          : !owned
            ? "Earn a sabotage by finishing a recipe"
            : "Sabotage!"}
      </button>
    </div>
  );
}

/** How long "Use it now" waits before the sabotage is saved for later. */
export const AWARD_DECIDE_MS = 3000;
const STORE_MS = 550;

/**
 * Full-screen "You've earned a sabotage!" moment with the award artwork. "Use
 * it now" drains over AWARD_DECIDE_MS; tapping anywhere else or letting it run
 * out saves it, shrinking the art into the Sabotage button.
 */
export function SabotageAwardPopup({
  definitionId,
  onUse,
  onClose,
  timerMs = AWARD_DECIDE_MS,
}: {
  definitionId: string;
  onUse?: () => void;
  /** Called once the "stored away" animation has finished. */
  onClose?: () => void;
  /** null holds the pop-up still (design sheet). */
  timerMs?: number | null;
}) {
  const root = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLImageElement>(null);
  const [flight, setFlight] = useState<{ x: number; y: number } | null>(null);
  const storing = flight !== null;

  // Fly the art to the Sabotage button (found beside this pop-up).
  function store() {
    if (storing) return;
    const img = art.current;
    const launch =
      root.current?.parentElement?.querySelector(".sabotage-launch");
    if (!img) return onClose?.();
    const from = img.getBoundingClientRect();
    // The pop-up may sit inside a scaled frame (dev pages): convert to its px.
    const k = img.offsetWidth ? from.width / img.offsetWidth : 1;
    const to = launch?.getBoundingClientRect() ?? {
      left: from.right,
      top: from.top,
      width: 0,
      height: 0,
    };
    setFlight({
      x: (to.left + to.width / 2 - (from.left + from.width / 2)) / k,
      y: (to.top + to.height / 2 - (from.top + from.height / 2)) / k,
    });
  }

  // Latest onClose without restarting the timer when the parent re-renders
  // (the game and the dev demo re-render every 100ms).
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!storing) return;
    const id = setTimeout(() => closeRef.current?.(), STORE_MS);
    return () => clearTimeout(id);
  }, [storing]);

  return (
    <div
      ref={root}
      className={`sabotage-award${storing ? " is-storing" : ""}`}
      role="dialog"
      aria-label="You've earned a sabotage"
      onClick={store}
    >
      <img
        ref={art}
        src={sabotageAwardArt(definitionId)}
        alt=""
        draggable={false}
        style={
          flight
            ? ({
                "--fly-x": `${flight.x}px`,
                "--fly-y": `${flight.y}px`,
              } as React.CSSProperties)
            : undefined
        }
      />
      <div className="sabotage-award-actions">
        <button
          type="button"
          className="sabotage-award-use"
          onClick={(e) => {
            e.stopPropagation();
            if (!storing) onUse?.();
          }}
        >
          {timerMs !== null && (
            <span
              className="sabotage-award-timer"
              style={{ animationDuration: `${timerMs}ms` }}
              onAnimationEnd={store}
              aria-hidden
            />
          )}
          <span style={{ position: "relative" }}>Use it now</span>
        </button>
        <span className="sabotage-award-hint">
          Tap anywhere else to save for later
        </span>
      </div>
    </div>
  );
}

/** Wording for a sabotage announcement. */
export function sabotageMessage(
  definitionId: string,
  source: string,
  target: string,
  itemName = "an ingredient",
) {
  return definitionId === "steal"
    ? `${source} stole ${itemName} from ${target}!`
    : definitionId === "trash"
      ? `${source} trashed ${itemName} from ${target}!`
      : definitionId === "freeze"
        ? `${source} froze ${target}!`
        : `${source} switched off everyone's store lights!`;
}

/** One announcement card ("Jun stole Tomato from you!"). */
export function SabotageNotice({
  definitionId,
  message,
  ingredientId,
}: {
  definitionId: string;
  message: string;
  /** Team ingredient id shown as an icon, for steal and trash. */
  ingredientId?: number | null;
}) {
  const ingredient = ingredients.find((entry) => entry.id === ingredientId);
  return (
    <div style={panel} className={`sabotage-notice sabotage-${definitionId}`}>
      <span className="sabotage-badge" aria-hidden="true">
        {SABOTAGE_BADGES[definitionId] ?? "⚡"}
      </span>
      {ingredient && <IngredientIcon id={iconIdFor(ingredient)} size={42} />}
      <span>{message}</span>
    </div>
  );
}

/** Host-only countdown for a timed sabotage. */
export function SabotageTimer({
  definitionId,
  name,
  who,
  seconds,
}: {
  definitionId: string;
  name: string;
  who: string;
  seconds: number;
}) {
  return (
    <div style={panel}>
      {SABOTAGE_BADGES[definitionId]} {name} · {who} · {seconds}s
    </div>
  );
}

export function SabotageBlackoutBar({ seconds }: { seconds: number }) {
  return (
    <div className="sabotage-blackout-status" role="status">
      💡 Blackout · {seconds}s · Check the big screen!
    </div>
  );
}

export function SabotageFreezeOverlay({ seconds }: { seconds: number }) {
  return (
    <div className="sabotage-freeze-overlay" role="alert">
      <div style={panel}>
        <div aria-hidden="true" style={{ fontSize: 72 }}>
          ❄️
        </div>
        <h2 style={{ font: lilita(38), margin: 8 }}>Frozen!</h2>
        <p>You can move again in {seconds}s</p>
      </div>
    </div>
  );
}

/** How long a paw takes to reach into the cart and pull an item out. */
export const PAW_MS = 1700;
const PAW_CHARACTERS = ["bear", "cat", "cow", "panda"];

/**
 * The sabotager's paw (their chef's colour) reaches down into your cart and
 * pulls the trashed item out, so you can see who took it.
 */
export function SabotagePawGrab({
  character,
  ingredientId,
}: {
  character?: string | null;
  ingredientId?: number | null;
}) {
  const paw = PAW_CHARACTERS.includes(character ?? "") ? character : "bear";
  const ingredient = ingredients.find((entry) => entry.id === ingredientId);
  return (
    <div className="sabotage-paw" aria-hidden>
      <div
        className="sabotage-paw-arm"
        style={{ animationDuration: `${PAW_MS}ms` }}
      >
        <img src={`/assets/paws/${paw}.png`} alt="" draggable={false} />
        {ingredient && (
          <span
            className="sabotage-paw-item"
            style={{ animationDuration: `${PAW_MS}ms` }}
          >
            <IngredientIcon id={iconIdFor(ingredient)} size={64} />
          </span>
        )}
      </div>
    </div>
  );
}

/** How long the host's "Blackout!" pop-up stays up. */
export const BLACKOUT_BANNER_MS = 2600;

/** Big "Blackout!" pop-up over the whole host screen. */
export function SabotageBlackoutBanner({ source }: { source: string }) {
  return (
    <div className="sabotage-blackout-banner" role="status">
      <div className="sabotage-blackout-card">
        <img src={sabotageArt("blackout")} alt="" draggable={false} />
        <strong>Blackout!</strong>
        <span>{source} switched off every store's lights</span>
      </div>
    </div>
  );
}

/* ------------------------------ Live components ----------------------------- */

export function SabotageControls({
  connection,
  open: openProp,
  onOpenChange,
  showLaunch = true,
}: {
  connection: GameConnection;
  /** Control the menu from outside (e.g. a button in the phone top bar). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Pin the ⚡ button to the screen corner (off when it lives in the top bar). */
  showLaunch?: boolean;
}) {
  const { sabotages } = connection;
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };
  const [picked, setPicked] = useState<string | null>(null);
  const [targetId, setTargetId] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const firstHeld =
    SABOTAGE_CARDS.find((card) => sabotages.holds(card.id))?.id ?? null;
  const selected = picked && sabotages.holds(picked) ? picked : firstHeld;
  const definition = definitions.find((entry) => entry.id === selected);
  const total = connection.state.recipeOrder.length;
  const targets: SabotageTargetOption[] = connection.state.players
    .filter((player) => !player.isHost && player.id !== connection.playerId)
    .map((player) => ({
      id: player.id,
      name: player.name,
      connected: player.connected,
      character: player.character,
      status:
        effectRemaining(sabotages.effects, "freeze", player.id, sabotages.now) >
        0
          ? "Frozen"
          : total && player.recipeIndex >= total
            ? "All done"
            : player.interfaceState === "store"
              ? "Shopping"
              : `Cooking · recipe ${player.recipeIndex + 1}`,
      items: Object.entries(player.inventory).flatMap(([id, n]) =>
        Array.from({ length: n }, () => Number(id)),
      ),
      available: canTarget(selected ?? "", player.inventory),
    }));

  useEffect(() => {
    if (open && !sabotages.frozenMs) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open, sabotages.frozenMs]);

  if (connection.results) return null;
  return (
    <>
      {showLaunch && (
        <SabotageLaunchButton
          credits={sabotages.held.length}
          frozen={sabotages.frozenMs > 0}
          onClick={() => setOpen(true)}
        />
      )}
      {sabotages.awarded && sabotages.awarded !== "*" && !open && (
        <SabotageAwardPopup
          definitionId={sabotages.awarded}
          onClose={sabotages.dismissAward}
          onUse={() => {
            setPicked(sabotages.awarded);
            setTargetId("");
            sabotages.dismissAward();
            setOpen(true);
          }}
        />
      )}
      <dialog
        ref={dialog}
        className="sabotage-dialog"
        aria-labelledby="sabotage-title"
        onCancel={() => setOpen(false)}
      >
        <SabotageMenu
          held={sabotages.held}
          selected={selected}
          onSelect={(id) => {
            setPicked(id);
            setTargetId("");
          }}
          targets={targets}
          targetId={targetId}
          onTarget={setTargetId}
          pending={sabotages.pending}
          frozen={sabotages.frozenMs > 0}
          used={sabotages.effects.some(
            (effect) =>
              effect.sourcePlayerId === connection.playerId &&
              effect.noticeUntil > sabotages.now,
          )}
          error={sabotages.error || undefined}
          onUse={() => {
            if (!definition) return;
            connection.sabotages.requestSabotage({
              definitionId: definition.id,
              ...(definition.targetScope === "single"
                ? { targetPlayerId: targetId }
                : {}),
            });
          }}
          onClose={() => setOpen(false)}
        />
      </dialog>
    </>
  );
}

export function SabotageEffects({
  connection,
  host = false,
}: {
  connection: GameConnection;
  host?: boolean;
}) {
  const { effects, now, frozenMs, blackoutMs } = connection.sabotages;
  if (connection.results) return null;
  const name = (id: string | null) =>
    connection.state.players.find((player) => player.id === id)?.name ??
    connection.players.find((player) => player.id === id)?.name ??
    "A chef";
  const notices = effects
    .filter((effect) => effect.noticeUntil > now)
    .slice(-3);
  const timed = effects.filter((effect) => (effect.localExpiresAt ?? 0) > now);
  // noticeUntil is 4.5s after the effect arrived; restored effects have none.
  const grab = host
    ? undefined
    : effects.find(
        (effect) =>
          ["trash", "steal"].includes(effect.definition.id) &&
          effect.targetPlayerId === connection.playerId &&
          effect.noticeUntil - NOTICE_MS + PAW_MS > now,
      );
  const characterOf = (id: string | null) =>
    connection.state.players.find((player) => player.id === id)?.character ??
    connection.players.find((player) => player.id === id)?.character;
  return (
    <>
      {grab && (
        <SabotagePawGrab
          key={grab.id}
          character={characterOf(grab.sourcePlayerId)}
          ingredientId={grab.ingredientId}
        />
      )}
      <div
        className={`sabotage-notices ${host ? "sabotage-host" : ""}`}
        aria-live="polite"
        aria-atomic="false"
      >
        {notices.map((effect) => {
          const ingredient = ingredients.find(
            (entry) => entry.id === effect.ingredientId,
          );
          const target =
            effect.targetPlayerId === connection.playerId && !host
              ? "you"
              : name(effect.targetPlayerId);
          return (
            <SabotageNotice
              key={effect.id}
              definitionId={effect.definition.id}
              ingredientId={effect.ingredientId}
              message={sabotageMessage(
                effect.definition.id,
                name(effect.sourcePlayerId),
                target,
                ingredient?.name,
              )}
            />
          );
        })}
        {host &&
          timed.map((effect) => (
            <SabotageTimer
              key={`timer:${effect.id}`}
              definitionId={effect.definition.id}
              name={effect.definition.name}
              who={
                effect.definition.targetScope === "all"
                  ? "Everyone"
                  : name(effect.targetPlayerId)
              }
              seconds={Math.ceil(((effect.localExpiresAt ?? now) - now) / 1000)}
            />
          ))}
      </div>
      {!host && blackoutMs > 0 && (
        <SabotageBlackoutBar seconds={Math.ceil(blackoutMs / 1000)} />
      )}
      {!host && frozenMs > 0 && (
        <SabotageFreezeOverlay seconds={Math.ceil(frozenMs / 1000)} />
      )}
    </>
  );
}
