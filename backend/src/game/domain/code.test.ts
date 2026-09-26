import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  GAME_CODE_ALPHABET,
  GAME_CODE_LENGTH,
  generateGameCode,
  generateHostToken,
  normalizeGameCode,
} from './code.ts';

test('generateGameCode returns codes of the expected length from the safe alphabet', () => {
  for (let index = 0; index < 200; index += 1) {
    const code = generateGameCode();

    assert.equal(code.length, GAME_CODE_LENGTH);

    for (const character of code) {
      assert.ok(GAME_CODE_ALPHABET.includes(character), `unexpected character "${character}"`);
    }
  }
});

test('generateGameCode honours a custom length', () => {
  assert.equal(generateGameCode(10).length, 10);
});

test('normalizeGameCode trims and uppercases', () => {
  assert.equal(normalizeGameCode('  ab2c9 '), 'AB2C9');
});

test('generateHostToken returns distinct, url-safe tokens', () => {
  const first = generateHostToken();
  const second = generateHostToken();

  assert.notEqual(first, second);
  assert.ok(first.length >= 16);
  assert.match(first, /^[A-Za-z0-9_-]+$/);
});
