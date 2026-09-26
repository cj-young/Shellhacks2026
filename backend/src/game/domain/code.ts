import { randomBytes, randomInt } from "node:crypto";

export const GAME_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const GAME_CODE_LENGTH = 6;

export function generateGameCode(length: number = GAME_CODE_LENGTH): string {
  let code = "";

  for (let index = 0; index < length; index += 1) {
    code += GAME_CODE_ALPHABET[randomInt(GAME_CODE_ALPHABET.length)];
  }

  return code;
}

export function normalizeGameCode(code: string): string {
  return code.trim().toUpperCase();
}

export function generateHostToken(): string {
  return randomBytes(24).toString("base64url");
}

export function generateReconnectToken(): string {
  return randomBytes(24).toString("base64url");
}
