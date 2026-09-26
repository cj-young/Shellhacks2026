import React, { useState } from "react";
import { Logo } from "../Logo";
import { RoomCode } from "../RoomCode";
import { TextInput } from "../TextInput";
import { Button } from "../Button";
import { Avatar } from "../Avatar";
import {
  AVAILABLE_CHEFS,
  ROOM_CODE,
  PLAYER_COLORS,
} from "#/data/chop-chop-mock";

export function MobileJoin() {
  const [playerName, setPlayerName] = useState("");
  const [selectedChef, setSelectedChef] = useState<string | null>(null);

  return (
    <div className="w-full h-screen bg-[var(--bg)] dot-grid overflow-y-auto flex flex-col max-w-sm mx-auto p-4">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <Logo size="md" rotation={-3} />
      </div>

      {/* Title */}
      <h1 className="display-md text-center text-[var(--ink)] mb-6">
        Join the Kitchen
      </h1>

      {/* Room code */}
      <div className="mb-8">
        <div className="text-label text-center mb-4">ENTER ROOM CODE</div>
        <RoomCode code={ROOM_CODE} variant="mobile" />
      </div>

      {/* Name input */}
      <div className="mb-6">
        <TextInput
          label="Your Name"
          placeholder="What's your chef name?"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
      </div>

      {/* Chef picker */}
      <div className="mb-8">
        <label className="text-label block mb-4">PICK YOUR CHEF</label>
        <div className="grid grid-cols-2 gap-3">
          {AVAILABLE_CHEFS.map((chef) => {
            const isTaken = false; // Mock: none are taken yet
            return (
              <button
                key={chef.id}
                onClick={() => !isTaken && setSelectedChef(chef.id)}
                disabled={isTaken}
                className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-[var(--surface)] transition-colors active:scale-95"
              >
                <Avatar
                  color={chef.color}
                  size="lg"
                  initials={chef.initials}
                  isSelected={selectedChef === chef.id}
                  isTaken={isTaken}
                />
                <div className="text-sm font-bold text-center">{chef.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Join button */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!playerName.trim() || !selectedChef}
      >
        Join Game!
      </Button>

      {/* Spacer */}
      <div className="flex-1" />
    </div>
  );
}
