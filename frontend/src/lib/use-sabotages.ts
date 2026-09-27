import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import definitions from "#/data/sabotages.json";
import type { PlayerSummary } from "./types";
import {
  canTarget,
  effectRemaining,
  localizeSabotage,
  sabotageCredits,
} from "./sabotages";
import type {
  SabotageAppliedPayload,
  SabotageEffect,
  UseSabotagePayload,
} from "./sabotages";

/** No optimistic effects: the room broadcast confirms use, and update_state owns inventory. */
export function useSabotages({
  socket,
  room,
  playerId,
  players,
  ended,
}: {
  socket: Socket | null;
  room: string | undefined;
  playerId: string | null;
  players: PlayerSummary[];
  ended: boolean;
}) {
  const [effects, setEffects] = useState<SabotageEffect[]>([]);
  const [spentIds, setSpentIds] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);
  const pendingRef = useRef<UseSabotagePayload | null>(null);
  const seen = useRef(new Set<string>());
  const spent = useRef<string[]>([]);
  const requestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const me = players.find((player) => player.id === playerId);

  useEffect(() => {
    const storageKey = `shellhacks.sabotageUses:${room}:${playerId}`;
    setEffects([]);
    setError("");
    setPending(false);
    pendingRef.current = null;
    spent.current = [];
    try {
      const saved: unknown = JSON.parse(
        sessionStorage.getItem(storageKey) ?? "[]",
      );
      if (Array.isArray(saved) && saved.every((id) => typeof id === "string"))
        spent.current = saved;
    } catch {
      /* Storage is optional in private browsing. */
    }
    setSpentIds(spent.current);
    seen.current = new Set(spent.current);
    if (!socket || !room) return;

    function clearPending() {
      pendingRef.current = null;
      setPending(false);
      if (requestTimer.current) clearTimeout(requestTimer.current);
    }
    function applied(payload: SabotageAppliedPayload) {
      if (seen.current.has(payload.id)) return;
      seen.current.add(payload.id);
      const receivedAt = Date.now();
      setNow(receivedAt);
      setEffects((current) => [
        ...current,
        localizeSabotage(payload, receivedAt),
      ]);
      if (payload.sourcePlayerId === playerId) {
        spent.current = [...spent.current, payload.id];
        setSpentIds(spent.current);
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(spent.current));
        } catch {
          /* Optional persistence. */
        }
        clearPending();
        setError("");
      }
    }
    function failed(payload: { code: string; message: string }) {
      if (
        !pendingRef.current ||
        ![
          "GAME_NOT_ACTIVE",
          "PLAYER_NOT_FOUND",
          "SABOTAGE_NOT_FOUND",
          "SABOTAGE_ALREADY_USED",
          "INVALID_TARGET",
          "INTERNAL_ERROR",
        ].includes(payload.code)
      )
        return;
      clearPending();
      setError(payload.message);
    }
    function disconnected() {
      if (!pendingRef.current) return;
      clearPending();
      setError("Connection lost. Waiting to reconnect.");
    }
    socket.on("sabotage_applied", applied);
    socket.on("game_error", failed);
    socket.on("disconnect", disconnected);
    return () => {
      socket.off("sabotage_applied", applied);
      socket.off("game_error", failed);
      socket.off("disconnect", disconnected);
      if (requestTimer.current) clearTimeout(requestTimer.current);
    };
  }, [room, playerId, socket]);

  useEffect(() => {
    if (ended) {
      setEffects([]);
      setPending(false);
      pendingRef.current = null;
      if (requestTimer.current) clearTimeout(requestTimer.current);
      return;
    }
    if (!effects.length) return;
    const timer = setInterval(() => {
      const time = Date.now();
      setNow(time);
      setEffects((current) =>
        current.filter(
          (effect) =>
            Math.max(effect.noticeUntil, effect.localExpiresAt ?? 0) > time,
        ),
      );
    }, 100);
    return () => clearInterval(timer);
  }, [effects.length, ended]);

  const credits = sabotageCredits(me?.recipeIndex ?? 0, spentIds);
  const frozenMs = effectRemaining(effects, "freeze", playerId, now);
  const blackoutMs = effectRemaining(effects, "blackout", playerId, now);

  function requestSabotage(payload: UseSabotagePayload) {
    if (
      ended ||
      me?.isHost ||
      credits < 1 ||
      pendingRef.current ||
      effectRemaining(effects, "freeze", playerId, Date.now()) > 0
    )
      return;
    if (!socket?.connected) {
      setError("Reconnect before using a sabotage.");
      return;
    }
    const definition = definitions.find(
      (entry) => entry.id === payload.definitionId,
    );
    if (!definition) return;
    if (definition.targetScope === "single") {
      const target = players.find(
        (player) => player.id === payload.targetPlayerId,
      );
      if (
        !target ||
        target.isHost ||
        !target.connected ||
        target.id === playerId ||
        !canTarget(definition.id, target.inventory)
      ) {
        setError("Choose another chef with an available target.");
        return;
      }
    }
    pendingRef.current = payload;
    setPending(true);
    setError("");
    // Don't queue actions to be replayed unexpectedly on reconnect.
    socket.emit("use_sabotage", payload);
    requestTimer.current = setTimeout(() => {
      pendingRef.current = null;
      setPending(false);
      setError(
        "No sabotage confirmation received. Your credit has not been spent.",
      );
    }, 5000);
  }

  return {
    credits,
    effects,
    now,
    frozenMs,
    blackoutMs,
    pending,
    error,
    requestSabotage,
  };
}
