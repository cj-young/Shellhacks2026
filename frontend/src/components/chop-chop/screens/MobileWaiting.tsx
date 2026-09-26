import React, { useEffect, useState } from "react";
import { Pill } from "../Pill";
import { Avatar } from "../Avatar";
import { MOCK_PLAYERS } from "#/data/chop-chop-mock";

// Demo: show first player's waiting screen
const demoPlayer = MOCK_PLAYERS[0];

export function MobileWaiting() {
  const [dots, setDots] = useState(".");

  // Animated dots for "Waiting for Start..."
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev === "." ? ".." : prev === ".." ? "..." : "."));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="w-full h-screen max-w-sm mx-auto overflow-hidden flex flex-col items-center justify-center gap-6 p-6 text-center"
      style={{ backgroundColor: demoPlayer.color }}
    >
      {/* Station pill */}
      <Pill color="royal" textColor="text-white">
        Prep Station
      </Pill>

      {/* Large avatar */}
      <Avatar color={demoPlayer.color} size="xl" initials={demoPlayer.avatar} />

      {/* "Look at the big screen!" text */}
      <div className="display-md text-white">Look at the big screen!</div>

      {/* Waiting status */}
      <Pill color="royal" textColor="text-white">
        Waiting for Start{dots}
      </Pill>
    </div>
  );
}
