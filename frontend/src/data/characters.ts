/** Chef characters players pick in the lobby. Ids must match the server's CHARACTERS list. */
export const CHARACTERS = [
  { id: "bear", name: "Bear", color: "#EF4128" },
  { id: "cat", name: "Cat", color: "#127C78" },
  { id: "cow", name: "Cow", color: "#E9A866" },
  { id: "panda", name: "Panda", color: "#0F7F3F" },
] as const;

export type CharacterId = (typeof CHARACTERS)[number]["id"];

export const characterImage = (id: string) => `/assets/characters/${id}.png`;
export const PLATE_IMAGE = "/assets/characters/plate.png";

export const getCharacter = (id: string | null | undefined) =>
  CHARACTERS.find((c) => c.id === id);
