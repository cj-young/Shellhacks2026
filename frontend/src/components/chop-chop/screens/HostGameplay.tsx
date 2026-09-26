import React, { useEffect, useState } from "react";
import { MOCK_GAMEPLAY_STATE, MOCK_PLAYERS } from "#/data/chop-chop-mock";
import { Pill } from "../Pill";
import { Card } from "../Card";

export function HostGameplay() {
  const [timeRemaining, setTimeRemaining] = useState(
    MOCK_GAMEPLAY_STATE.timeRemaining,
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-screen h-screen bg-[var(--bg)] dot-grid overflow-hidden flex flex-col p-6 gap-4">
      {/* Top section: Orders + Score/Timer */}
      <div className="flex gap-4 items-start">
        {/* Orders tickets */}
        <div className="flex-1 flex gap-3 overflow-x-auto pb-2">
          {MOCK_GAMEPLAY_STATE.orders.map((order) => (
            <Card key={order.id} className="min-w-64 flex-shrink-0">
              <div className="font-bold text-sm mb-1">{order.dishName}</div>
              <div className="text-xs text-[var(--ink-soft)] mb-2">
                Order for {order.customerName}
              </div>
              {/* Patience meter */}
              <div className="h-2 bg-[var(--bg)] rounded-full overflow-hidden border border-[var(--ink)]">
                <div
                  className="h-full bg-[var(--tomato)] transition-all duration-300"
                  style={{ width: `${Math.random() * 100}%` }}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Score + Timer */}
        <div className="flex flex-col gap-2 min-w-48">
          <Card className="text-center">
            <div className="text-label mb-1">TEAM SCORE</div>
            <div className="display-lg text-[var(--sun)]">
              {MOCK_GAMEPLAY_STATE.teamScore}
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-label mb-1">TIME</div>
            <div className="display-lg text-[var(--royal)]">
              {formatTime(timeRemaining)}
            </div>
          </Card>
        </div>
      </div>

      {/* Middle section: Stations */}
      <div className="flex-1 flex gap-4 min-h-0">
        {(["prep", "stove", "plating"] as const).map((station) => (
          <div key={station} className="flex-1 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <div className="text-label mb-4 capitalize text-center">
                {station} Station
              </div>
              {/* Queue items stacking */}
              <div className="flex-1 flex flex-col gap-2 justify-end overflow-y-auto">
                {MOCK_GAMEPLAY_STATE.queue
                  .filter((item) => item.currentStation === station)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[var(--surface-white)] rounded-lg border-2 border-[var(--ink)]"
                    >
                      <div className="font-bold text-sm mb-1">
                        Order #{item.orderId}
                      </div>
                      {/* Progress bar */}
                      <div className="h-3 bg-[var(--bg)] rounded-full overflow-hidden border border-[var(--ink)]">
                        <div
                          className="h-full bg-[var(--leaf)] transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-[var(--ink-soft)] mt-1">
                        {item.progress}%
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Bottom section: Player tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {MOCK_PLAYERS.map((player) => (
          <Card key={player.id} className="min-w-48 flex-shrink-0">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white border-2 border-[var(--ink)]"
                style={{ backgroundColor: player.color }}
              >
                {player.avatar}
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm">{player.name}</div>
                <div className="text-xs text-[var(--ink-soft)] capitalize">
                  {player.station}
                </div>
                {/* Mini progress bar */}
                <div className="h-2 bg-[var(--bg)] rounded-full overflow-hidden border border-[var(--ink)] mt-1">
                  <div
                    className="h-full bg-[player.color] transition-all"
                    style={{ width: "65%", backgroundColor: player.color }}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Bottleneck callout (if stations are backed up) */}
      {MOCK_GAMEPLAY_STATE.backedUpStations.length > 0 && (
        <div className="fixed top-6 right-6 animate-pulse">
          <div className="bg-[var(--tomato)] text-white font-display text-2xl font-bold px-6 py-4 rounded-2xl border-4 border-[var(--ink)] shadow-[0_8px_0_var(--ink)]">
            🚨 STOVE IS SLAMMED! 🚨
          </div>
        </div>
      )}
    </div>
  );
}
