import { useEffect, useState } from "react";
import type React from "react";
import {
  SABOTAGE_CARDS,
  SabotageAwardPopup,
  SabotageBlackoutBar,
  SabotageFreezeOverlay,
  SabotageLaunchButton,
  SabotageMenu,
  SabotageNotice,
  SabotageTimer,
  sabotageMessage,
} from "#/components/sabotage/SabotageUI";
import type { SabotageTargetOption } from "#/components/sabotage/SabotageUI";
import { StoreScreen } from "#/components/chop-chop/screens/RacePhoneScreens";
import { KitchenBackground } from "#/components/chop-chop/KitchenBackground";
import { iconIdFor } from "#/components/client/Store";
import definitions from "#/data/sabotages.json";
import ingredients from "#/data/ingredients.json";
import {
  INK,
  PAGE_BG,
  SUN,
  lilita,
  nunito,
} from "#/components/chop-chop/design";
import { paper } from "#/components/chop-chop/paper";

/**
 * A fake three-player game run entirely in the browser: award yourself
 * sabotages, use them from the real menu, get hit by Jun, and watch the
 * effects land on each phone and the TV. Nothing talks to the server.
 */

type Chef = {
  id: string;
  name: string;
  character: string;
  status: string;
  inventory: Record<number, number>;
};
type Effect = {
  id: number;
  defId: string;
  source: string;
  target: string | null;
  ingredientId: number | null;
  noticeUntil: number;
  expiresAt: number | null;
};

const START: Chef[] = [
  {
    id: "you",
    name: "Mina",
    character: "cat",
    status: "Shopping",
    inventory: { 1: 1, 2: 1 },
  },
  {
    id: "jun",
    name: "Jun",
    character: "bear",
    status: "Shopping",
    inventory: { 5: 2, 3: 1 },
  },
  {
    id: "ari",
    name: "Ari",
    character: "panda",
    status: "Cooking · recipe 2",
    inventory: {},
  },
];
const NOTICE_MS = 4500;
const shelf = ingredients.slice(0, 9).map((i) => ({ kind: iconIdFor(i) }));
const def = (id: string) => definitions.find((d) => d.id === id)!;
const items = (inv: Record<number, number>) =>
  Object.entries(inv).flatMap(([id, n]) =>
    Array.from({ length: n }, () => Number(id)),
  );

/** Contains position: fixed children (the transform makes it their containing block). */
function Frame({
  label,
  width,
  height,
  scale,
  children,
}: {
  label: string;
  width: number;
  height: number;
  scale: number;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ font: nunito(900, 13), letterSpacing: ".12em" }}>
        {label.toUpperCase()}
      </span>
      <div
        style={{
          width: width * scale,
          height: height * scale,
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 6px 18px rgba(61,40,23,.2)",
        }}
      >
        <div
          style={{
            position: "relative",
            width,
            height,
            background: "#E7DDC9",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

const button = (bg = "#fff"): React.CSSProperties => ({
  ...paper(16, 1),
  background: bg,
  padding: "7px 12px",
  font: nunito(900, 14),
  cursor: "pointer",
  textAlign: "left",
});

export function SabotageDemo() {
  const [chefs, setChefs] = useState(START);
  const [held, setHeld] = useState<string[]>(["trash", "freeze"]);
  const [effects, setEffects] = useState<Effect[]>([]);
  const [awarded, setAwarded] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [targetId, setTargetId] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [nextId, setNextId] = useState(1);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  const name = (id: string | null) =>
    chefs.find((c) => c.id === id)?.name ?? "A chef";
  const remaining = (defId: string, chefId: string) =>
    Math.max(
      0,
      ...effects
        .filter(
          (e) =>
            e.defId === defId &&
            (e.target === chefId ||
              (e.target === null && def(defId).targetScope === "all")),
        )
        .map((e) => (e.expiresAt ?? now) - now),
    );

  function apply(defId: string, source: string, target: string | null) {
    const d = def(defId);
    const t = Date.now();
    let ingredientId: number | null = null;
    if (defId === "trash" && target) {
      const victim = chefs.find((c) => c.id === target)!;
      const pool = items(victim.inventory);
      if (!pool.length) return;
      ingredientId = pool[Math.floor(Math.random() * pool.length)];
      setChefs((all) =>
        all.map((c) => {
          if (c.id !== target) return c;
          const inv = {
            ...c.inventory,
            [ingredientId!]: c.inventory[ingredientId!] - 1,
          };
          if (!inv[ingredientId!]) delete inv[ingredientId!];
          return { ...c, inventory: inv };
        }),
      );
    }
    setEffects((all) => [
      ...all.filter((e) => Math.max(e.noticeUntil, e.expiresAt ?? 0) > t),
      {
        id: nextId,
        defId,
        source,
        target: d.targetScope === "all" ? null : target,
        ingredientId,
        noticeUntil: t + NOTICE_MS,
        expiresAt: d.durationMs ? t + d.durationMs : null,
      },
    ]);
    setNextId((n) => n + 1);
  }

  function spendMine() {
    const d = selected ? def(selected) : null;
    if (!d) return;
    apply(d.id, "you", d.targetScope === "single" ? targetId : null);
    setHeld((h) => {
      const i = h.indexOf(d.id);
      return i < 0 ? h : [...h.slice(0, i), ...h.slice(i + 1)];
    });
    setTargetId("");
    setMenuOpen(false);
  }

  const firstHeld = SABOTAGE_CARDS.find((c) => held.includes(c.id))?.id ?? null;
  const selected = picked && held.includes(picked) ? picked : firstHeld;
  const youFrozen = remaining("freeze", "you") > 0;
  const targets: SabotageTargetOption[] = chefs
    .filter((c) => c.id !== "you")
    .map((c) => ({
      id: c.id,
      name: c.name,
      connected: true,
      character: c.character,
      status: remaining("freeze", c.id) > 0 ? "Frozen" : c.status,
      items: items(c.inventory),
      available: selected !== "trash" || items(c.inventory).length > 0,
    }));

  /** Notices as a given viewer sees them ("you" for themselves). */
  const noticesFor = (viewer: string | null) =>
    effects
      .filter((e) => e.noticeUntil > now)
      .slice(-3)
      .map((e) => {
        const who = (id: string | null) =>
          id && id === viewer ? "you" : name(id);
        const ing = ingredients.find((i) => i.id === e.ingredientId);
        return (
          <SabotageNotice
            key={e.id}
            definitionId={e.defId}
            ingredientId={e.ingredientId}
            message={sabotageMessage(
              e.defId,
              e.source === viewer ? "You" : name(e.source),
              who(e.target),
              ing?.name,
            )}
          />
        );
      });

  // A render function, not a component: defining a component here would
  // remount both phones on every 100ms tick.
  function renderPhone(chef: Chef) {
    const frozen = remaining("freeze", chef.id);
    const blackout = remaining("blackout", chef.id);
    const me = chef.id === "you";
    return (
      <>
        <div style={{ position: "absolute", inset: 0 }}>
          <div
            style={{ transform: "scale(.951)", transformOrigin: "top left" }}
          >
            <StoreScreen
              score={200}
              progress={40}
              blackout={blackout > 0}
              disabled={frozen > 0}
              aisleName="PRODUCE"
              aisleCount={3}
              aisleIndex={0}
              shelf={shelf}
              basket={items(chef.inventory).map((id) =>
                iconIdFor(ingredients.find((i) => i.id === id)!),
              )}
            />
          </div>
        </div>
        {me && (
          <SabotageLaunchButton
            credits={held.length}
            frozen={frozen > 0}
            onClick={() => setMenuOpen(true)}
          />
        )}
        <div className="sabotage-notices">{noticesFor(chef.id)}</div>
        {blackout > 0 && (
          <SabotageBlackoutBar seconds={Math.ceil(blackout / 1000)} />
        )}
        {frozen > 0 && (
          <SabotageFreezeOverlay seconds={Math.ceil(frozen / 1000)} />
        )}
        {me && awarded && (
          <SabotageAwardPopup
            definitionId={awarded}
            onClose={() => setAwarded(null)}
            onUse={() => {
              setPicked(awarded);
              setAwarded(null);
              setMenuOpen(true);
            }}
          />
        )}
        {me && menuOpen && !youFrozen && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 110,
              background: "#3d281799",
              display: "flex",
              alignItems: "center",
              padding: 10,
              boxSizing: "border-box",
            }}
          >
            <div
              className="sabotage-dialog"
              style={{
                display: "block",
                position: "static",
                maxHeight: "100%",
                overflowY: "auto",
              }}
            >
              <SabotageMenu
                held={held}
                selected={selected}
                onSelect={(id) => {
                  setPicked(id);
                  setTargetId("");
                }}
                targets={targets}
                targetId={targetId}
                onTarget={setTargetId}
                onUse={spendMine}
                onClose={() => setMenuOpen(false)}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  const timed = effects.filter((e) => (e.expiresAt ?? 0) > now);

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: PAGE_BG,
        color: INK,
        fontFamily: "Nunito, sans-serif",
        padding: "24px 28px",
        boxSizing: "border-box",
        display: "flex",
        gap: 28,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 250,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <h1 style={{ font: lilita(32, 1.05), margin: 0 }}>Sabotage demo</h1>
        <p style={{ font: nunito(700, 14), margin: 0, opacity: 0.8 }}>
          A fake game in your browser. Use the ⚡ button on your phone, or try
          these:
        </p>
        <strong
          style={{
            font: nunito(900, 12),
            letterSpacing: ".12em",
            marginTop: 6,
          }}
        >
          EARN ONE (SHOWS THE POP-UP)
        </strong>
        {SABOTAGE_CARDS.map((c) => (
          <button
            key={c.id}
            type="button"
            style={button(SUN)}
            onClick={() => {
              setHeld((h) => [...h, c.id]);
              setAwarded(c.id);
              setMenuOpen(false);
            }}
          >
            + {def(c.id).name}
          </button>
        ))}
        <strong
          style={{
            font: nunito(900, 12),
            letterSpacing: ".12em",
            marginTop: 6,
          }}
        >
          JUN USES ONE ON YOU
        </strong>
        {SABOTAGE_CARDS.map((c) => (
          <button
            key={c.id}
            type="button"
            style={button()}
            onClick={() => apply(c.id, "jun", "you")}
          >
            {def(c.id).name} you
          </button>
        ))}
        <button
          type="button"
          style={{ ...button(), marginTop: 10 }}
          onClick={() => {
            setChefs(START);
            setHeld(["trash", "freeze"]);
            setEffects([]);
            setAwarded(null);
            setMenuOpen(false);
            setTargetId("");
          }}
        >
          ↺ Reset
        </button>
        <p style={{ font: nunito(700, 13), margin: "6px 0 0", opacity: 0.7 }}>
          Mina (you): {items(chefs[0].inventory).length} · Jun:{" "}
          {items(chefs[1].inventory).length} · Ari:{" "}
          {items(chefs[2].inventory).length}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", gap: 20 }}>
          <Frame label="Your phone (Mina)" width={390} height={820} scale={0.62}>
            {renderPhone(chefs[0])}
          </Frame>
          <Frame label="Jun's phone" width={390} height={820} scale={0.62}>
            {renderPhone(chefs[1])}
          </Frame>
        </div>
        <Frame label="TV" width={1920} height={1080} scale={0.27}>
          <KitchenBackground />
          <div className="sabotage-notices sabotage-host">
            {noticesFor(null)}
            {timed.map((e) => (
              <SabotageTimer
                key={`t${e.id}`}
                definitionId={e.defId}
                name={def(e.defId).name}
                who={e.target ? name(e.target) : "Everyone"}
                seconds={Math.ceil(((e.expiresAt ?? now) - now) / 1000)}
              />
            ))}
          </div>
        </Frame>
      </div>
    </div>
  );
}
