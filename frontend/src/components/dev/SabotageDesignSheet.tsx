import type React from "react";
import {
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
import { TopBarAction } from "#/components/chop-chop/race";
import { iconIdFor } from "#/components/client/Store";
import ingredients from "#/data/ingredients.json";
import { INK, PAGE_BG, lilita, nunito } from "#/components/chop-chop/design";

/**
 * Every sabotage piece in every state, side by side, for redesigning. It renders
 * the same components the game uses (components/sabotage/SabotageUI.tsx), so
 * edits there show up here. Luke's "Sabotage playground" is the interactive test.
 */

const TOMATO_ID = 5;
const tomato = ingredients.find((i) => i.id === TOMATO_ID)?.name ?? "Tomato";

const TARGETS: SabotageTargetOption[] = [
  {
    id: "jun",
    name: "Jun",
    connected: true,
    character: "bear",
    status: "Shopping",
    items: [5, 5, 3],
    available: true,
  },
  {
    id: "ari",
    name: "Ari",
    connected: true,
    character: "panda",
    status: "Cooking · recipe 2",
    items: [],
    available: false,
  },
  {
    id: "mina",
    name: "Mina",
    connected: true,
    character: "cat",
    status: "Frozen",
    items: [4],
    available: true,
  },
  {
    id: "leo",
    name: "Leo",
    connected: false,
    character: "cow",
    status: "Shopping",
    items: [1],
    available: true,
  },
];
const shelf = ingredients.slice(0, 9).map((i) => ({ kind: iconIdFor(i) }));

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ font: lilita(28, 1.1), margin: "0 0 4px" }}>{title}</h2>
      {note && (
        <p style={{ font: nunito(700, 15), margin: "0 0 14px", opacity: 0.75 }}>
          {note}
        </p>
      )}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        {children}
      </div>
    </section>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ font: nunito(900, 13), letterSpacing: ".12em" }}>
        {label.toUpperCase()}
      </span>
      {children}
    </div>
  );
}

/**
 * A box that contains position: fixed children (the transform makes it their
 * containing block), so overlays and pinned buttons stay inside the frame.
 */
function Frame({
  width,
  height,
  scale = 1,
  children,
  background = "#E7DDC9",
}: {
  width: number;
  height: number;
  scale?: number;
  children: React.ReactNode;
  background?: string;
}) {
  return (
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
          background,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** The phone store behind phone-only pieces, for context. */
function PhoneBackdrop({
  blackout = false,
  frozen = false,
}: {
  blackout?: boolean;
  frozen?: boolean;
}) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ transform: "scale(.951)", transformOrigin: "top left" }}>
        <TopBarAction.Provider
          value={<SabotageLaunchButton inline credits={2} frozen={frozen} />}
        >
          <StoreScreen
            score={200}
            progress={40}
            blackout={blackout}
            aisleName="PRODUCE"
            aisleCount={3}
            aisleIndex={0}
            shelf={shelf}
            basket={[iconIdFor(ingredients[TOMATO_ID])]}
          />
        </TopBarAction.Provider>
      </div>
    </div>
  );
}

/** The menu as it appears in the dialog, without opening a real modal. */
function MenuCard(props: React.ComponentProps<typeof SabotageMenu>) {
  return (
    <div
      className="sabotage-dialog"
      style={{ display: "block", position: "static", margin: 0 }}
    >
      <SabotageMenu
        {...props}
        // Same rule as the game: only trash needs the chef to have items.
        targets={props.targets.map((t) => ({
          ...t,
          available: props.selected !== "trash" || t.items.length > 0,
        }))}
      />
    </div>
  );
}

const PHONE = { width: 390, height: 820, scale: 0.62 };

export function SabotageDesignSheet() {
  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: PAGE_BG,
        color: INK,
        fontFamily: "Nunito, sans-serif",
        padding: "28px 32px",
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ font: lilita(40, 1.1), margin: "0 0 4px" }}>
        Sabotage design sheet
      </h1>
      <p style={{ font: nunito(700, 16), margin: "0 0 28px", opacity: 0.8 }}>
        Every sabotage piece in every state. Components live in
        components/sabotage/SabotageUI.tsx; styles in sabotage.css.
      </p>

      <Section
        title="Launch button"
        note="Pinned to the top-right of the phone during play."
      >
        {(
          [
            ["3 credits", 3, false],
            ["No credits", 0, false],
            ["Frozen (disabled)", 2, true],
          ] as const
        ).map(([label, credits, frozen]) => (
          <Labeled key={label} label={label}>
            <Frame width={240} height={70}>
              <SabotageLaunchButton inline credits={credits} frozen={frozen} />
            </Frame>
          </Labeled>
        ))}
      </Section>

      <Section
        title="You've earned a sabotage!"
        note="Pops up on the phone when a finished recipe awards a random sabotage."
      >
        {(["trash", "freeze", "blackout"] as const).map((id) => (
          <Labeled key={id} label={id}>
            <Frame {...PHONE}>
              <PhoneBackdrop />
              <SabotageAwardPopup definitionId={id} timerMs={null} />
            </Frame>
          </Labeled>
        ))}
      </Section>

      <Section
        title="Sabotage menu"
        note="Only earned sabotages light up. Jun has ingredients, Ari has none, Mina is frozen, Leo is disconnected."
      >
        <Labeled label="Nothing earned yet">
          <MenuCard held={[]} selected={null} targets={TARGETS} targetId="" />
        </Labeled>
        <Labeled label="Trash · pick a chef">
          <MenuCard
            held={["trash"]}
            selected="trash"
            targets={TARGETS}
            targetId=""
          />
        </Labeled>
        <Labeled label="Trash · chef chosen">
          <MenuCard
            held={["trash", "trash", "blackout"]}
            selected="trash"
            targets={TARGETS}
            targetId="jun"
          />
        </Labeled>
        <Labeled label="Freeze">
          <MenuCard
            held={["freeze"]}
            selected="freeze"
            targets={TARGETS}
            targetId="jun"
          />
        </Labeled>
        <Labeled label="Blackout · hits everyone">
          <MenuCard
            held={["trash", "blackout"]}
            selected="blackout"
            targets={TARGETS}
            targetId=""
          />
        </Labeled>
        <Labeled label="Sending">
          <MenuCard
            held={["freeze"]}
            selected="freeze"
            targets={TARGETS}
            targetId="jun"
            pending
          />
        </Labeled>
        <Labeled label="Used">
          <MenuCard
            held={[]}
            selected={null}
            targets={TARGETS}
            targetId=""
            used
          />
        </Labeled>
        <Labeled label="Rejected">
          <MenuCard
            held={["trash"]}
            selected="trash"
            targets={TARGETS}
            targetId="jun"
            error="Jun has nothing left to trash. Your sabotage was kept."
          />
        </Labeled>
        <Labeled label="No other chefs">
          <MenuCard
            held={["freeze"]}
            selected="freeze"
            targets={[]}
            targetId=""
          />
        </Labeled>
      </Section>

      <Section
        title="Announcements"
        note="Pop up above the cart on phones (and on the TV) for a few seconds."
      >
        <Labeled label="Steal · you were hit">
          <SabotageNotice
            definitionId="steal"
            ingredientId={TOMATO_ID}
            message={sabotageMessage("steal", "Jun", "you", tomato)}
          />
        </Labeled>
        <Labeled label="Trash">
          <SabotageNotice
            definitionId="trash"
            ingredientId={TOMATO_ID}
            message={sabotageMessage("trash", "Jun", "Ari", tomato)}
          />
        </Labeled>
        <Labeled label="Freeze">
          <SabotageNotice
            definitionId="freeze"
            message={sabotageMessage("freeze", "Jun", "you")}
          />
        </Labeled>
        <Labeled label="Blackout">
          <SabotageNotice
            definitionId="blackout"
            message={sabotageMessage("blackout", "Jun", "everyone")}
          />
        </Labeled>
      </Section>

      <Section
        title="On the phone"
        note="The overlays in place over the store."
      >
        <Labeled label="Playing">
          <Frame {...PHONE}>
            <PhoneBackdrop />
          </Frame>
        </Labeled>
        <Labeled label="Stolen from">
          <Frame {...PHONE}>
            <PhoneBackdrop />
            <div className="sabotage-notices">
              <SabotageNotice
                definitionId="steal"
                ingredientId={TOMATO_ID}
                message={sabotageMessage("steal", "Jun", "you", tomato)}
              />
            </div>
          </Frame>
        </Labeled>
        <Labeled label="Frozen">
          <Frame {...PHONE}>
            <PhoneBackdrop frozen />
            <SabotageFreezeOverlay seconds={7} />
          </Frame>
        </Labeled>
        <Labeled label="Blackout">
          <Frame {...PHONE}>
            <PhoneBackdrop blackout />
            <SabotageBlackoutBar seconds={12} />
          </Frame>
        </Labeled>
      </Section>

      <Section
        title="On the TV"
        note="Host shows announcements plus countdowns for timed sabotages."
      >
        <Labeled label="Host · 1920×1080 at 40%">
          <Frame width={1920} height={1080} scale={0.4}>
            <KitchenBackground />
            <div className="sabotage-notices sabotage-host">
              <SabotageNotice
                definitionId="steal"
                ingredientId={TOMATO_ID}
                message={sabotageMessage("steal", "Jun", "Ari", tomato)}
              />
              <SabotageNotice
                definitionId="freeze"
                message={sabotageMessage("freeze", "Leo", "Mina")}
              />
              <SabotageTimer
                definitionId="freeze"
                name="Freeze"
                who="Mina"
                seconds={8}
              />
              <SabotageTimer
                definitionId="blackout"
                name="Blackout"
                who="Everyone"
                seconds={13}
              />
            </div>
          </Frame>
        </Labeled>
      </Section>
    </div>
  );
}
