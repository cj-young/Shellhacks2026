import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { GameConnection } from "#/lib/use-game-connection";
import definitions from "#/data/sabotages.json";
import ingredients from "#/data/ingredients.json";
import { canTarget } from "#/lib/sabotages";
import { IngredientIcon } from "#/components/chop-chop/IngredientIcon";
import { iconIdFor } from "#/components/client/Store";
import { CARD_BG, INK, lilita, nunito } from "#/components/chop-chop/design";
import "./sabotage.css";

/** Swap these badges and the CSS animations when final sabotage artwork is ready. */
const badges: Record<string, string> = {
  steal: "✋",
  trash: "🗑️",
  freeze: "❄️",
  blackout: "💡",
};
const panel: CSSProperties = {
  background: CARD_BG,
  color: INK,
  border: `3px solid ${INK}`,
  borderRadius: 22,
  padding: 16,
  boxShadow: "0 5px 0 #3d281733",
  font: nunito(800, 16),
};

export function SabotageControls({
  connection,
}: {
  connection: GameConnection;
}) {
  const { sabotages } = connection;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("steal");
  const [targetId, setTargetId] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const definition = definitions.find((entry) => entry.id === selected)!;
  const targets = connection.state.players.filter(
    (player) => !player.isHost && player.id !== connection.playerId,
  );
  const target = targets.find((player) => player.id === targetId);
  const disabled =
    sabotages.pending || sabotages.frozenMs > 0 || sabotages.credits < 1;
  const validTarget =
    definition.targetScope !== "single" ||
    (target?.connected && canTarget(selected, target.inventory));

  useEffect(() => {
    if (open && !sabotages.frozenMs) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open, sabotages.frozenMs]);

  if (connection.results) return null;
  return (
    <>
      <button
        type="button"
        className="sabotage-launch"
        disabled={sabotages.frozenMs > 0}
        onClick={() => setOpen(true)}
      >
        ⚡ Sabotage · {sabotages.credits}
      </button>
      <dialog
        ref={dialog}
        className="sabotage-dialog"
        aria-labelledby="sabotage-title"
        onCancel={() => setOpen(false)}
      >
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
              onClick={() => setOpen(false)}
              aria-label="Close sabotage menu"
            >
              ✕
            </button>
          </div>
          <p role="status">
            {sabotages.credits} saved{" "}
            {sabotages.credits === 1 ? "credit" : "credits"}. Finish a recipe to
            earn one. Save them for any time!
          </p>
          <div className="sabotage-options">
            {definitions.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={selected === entry.id}
                onClick={() => {
                  setSelected(entry.id);
                  setTargetId("");
                }}
              >
                <span aria-hidden="true">{badges[entry.id]}</span> {entry.name}
              </button>
            ))}
          </div>
          <p>
            {definition.description}{" "}
            {definition.durationMs
              ? `Lasts ${definition.durationMs / 1000} seconds.`
              : ""}
          </p>
          {definition.targetScope === "single" ? (
            <fieldset>
              <legend>Choose a chef</legend>
              {targets.map((player) => {
                const available =
                  player.connected && canTarget(selected, player.inventory);
                return (
                  <label key={player.id} className="sabotage-target">
                    <input
                      type="radio"
                      name="sabotage-target"
                      value={player.id}
                      checked={targetId === player.id}
                      disabled={!available || sabotages.pending}
                      onChange={() => setTargetId(player.id)}
                    />
                    {player.name}
                    {!player.connected
                      ? " · disconnected"
                      : !available
                        ? " · no unused ingredients"
                        : ""}
                  </label>
                );
              })}
              {!targets.length && <p>No other chefs to target yet.</p>}
            </fieldset>
          ) : (
            <p>Targets everyone, including you.</p>
          )}
          {sabotages.effects.some(
            (effect) =>
              effect.sourcePlayerId === connection.playerId &&
              effect.noticeUntil > sabotages.now,
          ) && <p role="status">Sabotage used! One credit spent.</p>}
          {sabotages.error && <p role="alert">{sabotages.error}</p>}
          <button
            className="sabotage-use"
            type="button"
            disabled={disabled || !validTarget}
            onClick={() =>
              connection.sabotages.requestSabotage({
                definitionId: selected,
                ...(definition.targetScope === "single"
                  ? { targetPlayerId: targetId }
                  : {}),
              })
            }
          >
            {sabotages.pending
              ? "Sending…"
              : `Use ${definition.name} · 1 credit`}
          </button>
        </div>
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
  return (
    <>
      <div
        className={`sabotage-notices ${host ? "sabotage-host" : ""}`}
        aria-live="polite"
        aria-atomic="false"
      >
        {notices.map((effect) => {
          const ingredient = ingredients.find(
            (entry) => entry.id === effect.ingredientId,
          );
          const itemName = ingredient?.name ?? "an ingredient";
          const source = name(effect.sourcePlayerId);
          const target =
            effect.targetPlayerId === connection.playerId && !host
              ? "you"
              : name(effect.targetPlayerId);
          const message =
            effect.definition.id === "steal"
              ? `${source} stole ${itemName} from ${target}!`
              : effect.definition.id === "trash"
                ? `${source} trashed ${itemName} from ${target}!`
                : effect.definition.id === "freeze"
                  ? `${source} froze ${target}!`
                  : `${source} switched off everyone's store lights!`;
          return (
            <div
              key={effect.id}
              style={panel}
              className={`sabotage-notice sabotage-${effect.definition.id}`}
            >
              <span className="sabotage-badge" aria-hidden="true">
                {badges[effect.definition.id] ?? "⚡"}
              </span>
              {ingredient && (
                <IngredientIcon id={iconIdFor(ingredient)} size={42} />
              )}
              <span>{message}</span>
            </div>
          );
        })}
        {host &&
          timed.map((effect) => (
            <div key={`timer:${effect.id}`} style={panel}>
              {badges[effect.definition.id]} {effect.definition.name} ·{" "}
              {effect.definition.targetScope === "all"
                ? "Everyone"
                : name(effect.targetPlayerId)}{" "}
              · {Math.ceil(((effect.localExpiresAt ?? now) - now) / 1000)}s
            </div>
          ))}
      </div>
      {!host && blackoutMs > 0 && (
        <div className="sabotage-blackout-status" role="status">
          💡 Blackout · {Math.ceil(blackoutMs / 1000)}s · Check the big screen!
        </div>
      )}
      {!host && frozenMs > 0 && (
        <div className="sabotage-freeze-overlay" role="alert">
          <div style={panel}>
            <div aria-hidden="true" style={{ fontSize: 72 }}>
              ❄️
            </div>
            <h2 style={{ font: lilita(38), margin: 8 }}>Frozen!</h2>
            <p>You can move again in {Math.ceil(frozenMs / 1000)}s</p>
          </div>
        </div>
      )}
    </>
  );
}
