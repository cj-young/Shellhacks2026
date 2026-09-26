import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import type { Game } from '../domain/game.ts';
import { InMemoryGameStore } from '../infrastructure/in-memory-game-store.ts';
import type { GameStore } from '../ports/game-store.ts';
import { GameService } from './game-service.ts';

test('createGame stores the game and getGame finds it case-insensitively', async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();

  assert.equal(game.status, 'lobby');
  assert.ok(game.hostToken.length > 0);
  assert.equal((await service.getGame(game.code.toLowerCase()))?.code, game.code);
  assert.equal((await service.getGame(`  ${game.code}  `))?.code, game.code);
  assert.equal(await service.getGame('MISSING'), undefined);
});

test('createGame retries when a code is already taken', async () => {
  const attempts: string[] = [];
  const store: GameStore = {
    async createIfAbsent(game: Game): Promise<boolean> {
      attempts.push(game.code);
      return attempts.length >= 3;
    },
    async get(): Promise<Game | undefined> {
      return undefined;
    },
    async save(): Promise<void> {
      return;
    },
    async delete(): Promise<boolean> {
      return false;
    },
  };

  const game = await new GameService(store).createGame();

  assert.equal(attempts.length, 3);
  assert.equal(game.code, attempts[2]);
});

test('createGame rejects after exhausting all attempts', async () => {
  const store: GameStore = {
    async createIfAbsent(): Promise<boolean> {
      return false;
    },
    async get(): Promise<Game | undefined> {
      return undefined;
    },
    async save(): Promise<void> {
      return;
    },
    async delete(): Promise<boolean> {
      return false;
    },
  };

  await assert.rejects(() => new GameService(store).createGame());
});

test('startGame moves a lobby game to active and persists it', async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();

  const result = await service.startGame(game.code.toLowerCase());

  assert.equal(result.ok, true);
  if (!result.ok) {
    assert.fail('expected start to succeed');
  }
  assert.equal(result.game.status, 'active');
  assert.equal((await service.getGame(game.code))?.status, 'active');
});

test('startGame reports GAME_NOT_FOUND for an unknown code', async () => {
  const service = new GameService(new InMemoryGameStore());

  const result = await service.startGame('ZZZZZZ');

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail('expected start to fail');
  }
  assert.equal(result.code, 'GAME_NOT_FOUND');
});

test('startGame reports ALREADY_STARTED for an active game', async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();
  await service.startGame(game.code);

  const result = await service.startGame(game.code);

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail('expected start to fail');
  }
  assert.equal(result.code, 'ALREADY_STARTED');
});
