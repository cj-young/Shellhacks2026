import React, { useState } from "react";
import { HostLobbyNew } from "./screens/HostLobbyNew";
import { MobileJoinNew } from "./screens/MobileJoinNew";
import { MobileWaitingNew } from "./screens/MobileWaitingNew";
import { HostVictoryNew } from "./screens/HostVictoryNew";
import { HostRaceStacks } from "./screens/HostRaceStacks";
import { TimesUpPreview } from "./screens/TimesUp";
import {
  LeaderboardPreview,
  LeaderboardSoloPreview,
} from "./screens/RoundLeaderboard";
import {
  RacePhoneChop,
  RacePhonePlating,
  RacePhoneRobbed,
  RacePhoneStore,
  RacePhoneStove,
} from "./screens/RacePhoneScreens";
import { AssetSheet, ASSET_SHEET_SIZE } from "./screens/AssetSheet";
import {
  HostMenuPrepping,
  HostMenuShopping,
  PlayerChopTacos,
  PlayerFlipCheeseburger,
  PlayerPlatePancakes,
  PlayerRecipeCardTacos,
  PlayerStoreProduce,
} from "./screens/MenuStates";
import { FitToViewport } from "./FitToViewport";
import {
  VEGGIE_SIZES_CANVAS,
  VeggieBackgroundSizes,
} from "./screens/VeggieBackgroundSizes";

type Screen = { id: string; label: string; component: React.ComponentType };
type Device = "host" | "player" | "sheet" | "sizes";

const DEVICE_SIZE: Record<Device, { width: number; height: number }> = {
  host: { width: 1920, height: 1080 },
  player: { width: 410, height: 864 },
  sheet: ASSET_SHEET_SIZE,
  sizes: VEGGIE_SIZES_CANVAS,
};

const SECTIONS: { title: string; device: Device; screens: Screen[] }[] = [
  {
    title: "Host · big screen",
    device: "host",
    screens: [
      { id: "host-lobby", label: "Lobby", component: HostLobbyNew },
      {
        id: "host-race-stacks",
        label: "Gameplay · card stacks",
        component: HostRaceStacks,
      },
      { id: "host-times-up", label: "Time's up", component: TimesUpPreview },
      {
        id: "host-leaderboard",
        label: "Leaderboard · 4 chefs",
        component: LeaderboardPreview,
      },
      {
        id: "host-leaderboard-solo",
        label: "Leaderboard · solo",
        component: LeaderboardSoloPreview,
      },
      {
        id: "host-round-clear",
        label: "Round clear",
        component: HostVictoryNew,
      },
    ],
  },
  {
    title: "Player · phone",
    device: "player",
    screens: [
      { id: "player-join", label: "Join", component: MobileJoinNew },
      { id: "player-waiting", label: "Waiting", component: MobileWaitingNew },
      { id: "player-store", label: "Store", component: RacePhoneStore },
      { id: "player-chop", label: "Chop", component: RacePhoneChop },
      { id: "player-stove", label: "Stove", component: RacePhoneStove },
      { id: "player-plating", label: "Plating", component: RacePhonePlating },
      { id: "player-robbed", label: "Robbed", component: RacePhoneRobbed },
    ],
  },
  {
    title: "Menu recipes · host",
    device: "host",
    screens: [
      {
        id: "menu-host-shopping",
        label: "Everyone shopping",
        component: HostMenuShopping,
      },
      {
        id: "menu-host-prepping",
        label: "Chop · stir · flip · plate",
        component: HostMenuPrepping,
      },
    ],
  },
  {
    title: "Menu recipes · phone",
    device: "player",
    screens: [
      {
        id: "menu-player-card",
        label: "Recipe card · Tacos",
        component: PlayerRecipeCardTacos,
      },
      {
        id: "menu-player-store",
        label: "Store · Produce",
        component: PlayerStoreProduce,
      },
      {
        id: "menu-player-chop",
        label: "Chop · Tacos",
        component: PlayerChopTacos,
      },
      {
        id: "menu-player-flip",
        label: "Flip · Cheeseburger",
        component: PlayerFlipCheeseburger,
      },
      {
        id: "menu-player-plate",
        label: "Plate · Pancakes",
        component: PlayerPlatePancakes,
      },
    ],
  },
  {
    title: "Assets",
    device: "sheet",
    screens: [
      {
        id: "asset-sheet",
        label: "Ingredient & dish sheet",
        component: AssetSheet,
      },
    ],
  },
  {
    title: "Backgrounds",
    device: "sizes",
    screens: [
      {
        id: "veggie-background-sizes",
        label: "Veggie background · sizes",
        component: VeggieBackgroundSizes,
      },
    ],
  },
];

export function ScreenSwitcher() {
  const [currentScreen, setCurrentScreen] = useState("host-lobby");

  const section =
    SECTIONS.find((s) =>
      s.screens.some((screen) => screen.id === currentScreen),
    ) ?? SECTIONS[0];
  const CurrentComponent =
    section.screens.find((s) => s.id === currentScreen)?.component ??
    HostLobbyNew;
  const size = DEVICE_SIZE[section.device];

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
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {SECTIONS.map((group) => (
            <div
              key={group.title}
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <span
                style={{
                  font: "900 12px Nunito",
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  color: "#2B2A6B",
                }}
              >
                {group.title}
              </span>
              {group.screens.map((screen) => (
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
        <FitToViewport width={size.width} height={size.height}>
          <CurrentComponent />
        </FitToViewport>
      </div>
    </div>
  );
}
