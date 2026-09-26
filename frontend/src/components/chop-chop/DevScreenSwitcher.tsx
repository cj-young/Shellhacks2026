import React, { useState } from "react";
import { HostLobby } from "./screens/HostLobby";
import { MobileJoin } from "./screens/MobileJoin";
import { MobileWaiting } from "./screens/MobileWaiting";
import { HostGameplay } from "./screens/HostGameplay";
import { HostResults } from "./screens/HostResults";
import { MobilePrep } from "./screens/MobilePrep";
import { MobileStove } from "./screens/MobileStove";
import { MobilePlating } from "./screens/MobilePlating";
import { MobileAssist } from "./screens/MobileAssist";
import { MobileBackedUp } from "./screens/MobileBackedUp";

type Screen =
  | "host-lobby"
  | "mobile-join"
  | "mobile-waiting"
  | "host-gameplay"
  | "host-results"
  | "mobile-prep"
  | "mobile-stove"
  | "mobile-plating"
  | "mobile-assist"
  | "mobile-backed-up";

const SCREENS: { id: Screen; label: string; component: React.ComponentType }[] =
  [
    { id: "host-lobby", label: "Host Lobby", component: HostLobby },
    { id: "host-gameplay", label: "Host Gameplay", component: HostGameplay },
    { id: "host-results", label: "Host Results", component: HostResults },
    { id: "mobile-join", label: "Mobile Join", component: MobileJoin },
    { id: "mobile-waiting", label: "Mobile Waiting", component: MobileWaiting },
    { id: "mobile-prep", label: "Mobile Prep Station", component: MobilePrep },
    {
      id: "mobile-stove",
      label: "Mobile Stove Station",
      component: MobileStove,
    },
    {
      id: "mobile-plating",
      label: "Mobile Plating Station",
      component: MobilePlating,
    },
    {
      id: "mobile-assist",
      label: "Mobile Assist Mode",
      component: MobileAssist,
    },
    {
      id: "mobile-backed-up",
      label: "Mobile Backed Up",
      component: MobileBackedUp,
    },
  ];

export function DevScreenSwitcher() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("host-lobby");

  const CurrentComponent =
    SCREENS.find((s) => s.id === currentScreen)?.component || HostLobby;

  return (
    <div className="flex h-screen bg-[var(--bg)]">
      {/* Sidebar */}
      <div className="w-48 bg-[var(--surface)] border-r-2 border-[var(--ink)] p-4 overflow-y-auto">
        <h2 className="font-display font-bold text-lg mb-4 text-[var(--ink)]">
          Chop Chop Screens
        </h2>
        <div className="space-y-2">
          {SCREENS.map((screen) => (
            <button
              key={screen.id}
              onClick={() => setCurrentScreen(screen.id)}
              className={`
                w-full text-left px-4 py-2 rounded-md font-bold text-sm transition-colors
                ${
                  currentScreen === screen.id
                    ? "bg-[var(--royal)] text-white"
                    : "bg-[var(--bg)] text-[var(--ink)] hover:bg-[var(--bg-dots)]"
                }
              `}
            >
              {screen.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <CurrentComponent />
      </div>
    </div>
  );
}
