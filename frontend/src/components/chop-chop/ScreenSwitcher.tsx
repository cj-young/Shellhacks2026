import React, { useState } from "react";
import { HostLobbyNew } from "./screens/HostLobbyNew";
import { MobileJoinNew } from "./screens/MobileJoinNew";
import { MobileWaitingNew } from "./screens/MobileWaitingNew";
import { HostVictoryNew } from "./screens/HostVictoryNew";
import { HostRaceStacks } from "./screens/HostRaceStacks";
import {
  RacePhoneChop,
  RacePhonePlating,
  RacePhoneRobbed,
  RacePhoneStore,
  RacePhoneStove,
} from "./screens/RacePhoneScreens";
import { FitToViewport } from "./FitToViewport";

type Screen =
  | "host-lobby"
  | "mobile-join"
  | "mobile-waiting"
  | "host-victory"
  | "host-race-stacks"
  | "mobile-race-store"
  | "mobile-race-chop"
  | "mobile-race-stove"
  | "mobile-race-plating"
  | "mobile-race-robbed";

const SCREENS: { id: Screen; label: string; component: React.ComponentType }[] =
  [
    { id: "host-lobby", label: "① Host Lobby", component: HostLobbyNew },
    { id: "mobile-join", label: "② Mobile Join", component: MobileJoinNew },
    {
      id: "mobile-waiting",
      label: "③ Mobile Waiting",
      component: MobileWaitingNew,
    },
    {
      id: "host-victory",
      label: "④ Host Round Clear",
      component: HostVictoryNew,
    },
    {
      id: "host-race-stacks",
      label: "5b Host Race Stacks",
      component: HostRaceStacks,
    },
    {
      id: "mobile-race-store",
      label: "6.1 Phone Store",
      component: RacePhoneStore,
    },
    {
      id: "mobile-race-chop",
      label: "6.2 Phone Chop",
      component: RacePhoneChop,
    },
    {
      id: "mobile-race-stove",
      label: "6.3 Phone Stove",
      component: RacePhoneStove,
    },
    {
      id: "mobile-race-plating",
      label: "6.4 Phone Plating",
      component: RacePhonePlating,
    },
    {
      id: "mobile-race-robbed",
      label: "6.5 Phone Robbed",
      component: RacePhoneRobbed,
    },
  ];

export function ScreenSwitcher() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("host-lobby");

  const CurrentComponent =
    SCREENS.find((s) => s.id === currentScreen)?.component || HostLobbyNew;
  const isMobile = currentScreen.startsWith("mobile");

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#EEF3FB",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "200px",
          backgroundColor: "#F7F9FE",
          borderRight: "3px solid #2B2A6B",
          padding: "24px",
          overflowY: "auto",
          fontFamily: '"Nunito", sans-serif',
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            fontFamily: '"Lilita One", sans-serif',
            fontSize: "24px",
            marginBottom: "24px",
            color: "#2B2A6B",
            margin: "0 0 24px 0",
          }}
        >
          Chop Chop
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {SCREENS.map((screen) => (
            <button
              key={screen.id}
              onClick={() => setCurrentScreen(screen.id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "3px solid #2B2A6B",
                backgroundColor:
                  currentScreen === screen.id ? "#1F4FD8" : "#fff",
                color: currentScreen === screen.id ? "#fff" : "#2B2A6B",
                font: "bold 14px Nunito",
                cursor: "pointer",
                transition: "all 150ms",
              }}
            >
              {screen.label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: "16px",
          boxSizing: "border-box",
        }}
      >
        <FitToViewport
          width={isMobile ? 410 : 1920}
          height={isMobile ? 864 : 1080}
        >
          <CurrentComponent />
        </FitToViewport>
      </div>
    </div>
  );
}
