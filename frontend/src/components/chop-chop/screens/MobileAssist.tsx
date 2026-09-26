import React from "react";
import { Pill } from "../Pill";
import { Button } from "../Button";
import { Card } from "../Card";
import { PLAYER_COLORS } from "#/data/chop-chop-mock";

export function MobileAssist() {
  const backedUpStations = ["stove", "plating"];

  return (
    <div className="w-full h-screen max-w-sm mx-auto overflow-hidden flex flex-col bg-[var(--bg)] dot-grid">
      {/* Header */}
      <div className="p-4 border-b-4 border-[var(--ink)]">
        <Pill
          color="royal"
          textColor="text-white"
          className="w-full justify-center"
        >
          Assist Mode
        </Pill>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">🆘</div>
          <h1 className="display-md text-[var(--ink)]">Station Needs Help!</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-2">
            Your teammate needs backup
          </p>
        </div>

        {/* Backed up stations */}
        <div className="space-y-3 w-full">
          {backedUpStations.map((station) => (
            <Card
              key={station}
              className="border-4 border-[var(--tomato)] cursor-pointer hover:shadow-[0_8px_0_var(--ink)] transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">🚨</div>
                <div className="flex-1">
                  <div className="font-bold capitalize">{station} Station</div>
                  <div className="text-sm text-[var(--ink-soft)]">
                    3 items waiting
                  </div>
                </div>
                <div className="text-sm font-bold text-[var(--tomato)]">
                  TAP
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <Button variant="danger" size="lg" className="w-full mt-6">
          Help Stove Station
        </Button>
      </div>

      {/* Bottom: Instructions */}
      <div className="p-4 border-t-4 border-[var(--ink)]">
        <div className="text-xs text-center text-[var(--ink-soft)]">
          <p>
            🆘 When you tap a station, you'll help process items in their queue.
          </p>
        </div>
      </div>
    </div>
  );
}
