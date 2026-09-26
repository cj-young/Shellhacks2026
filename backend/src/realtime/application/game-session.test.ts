import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { GameService } from '../../game/application/game-service.ts';
import { InMemoryGameStore } from '../../game/infrastructure/in-memory-game-store.ts';
import { GameSession } from './game-session.ts';

function setup(): { gameService: GameService; session: GameSession } {
  const gameService = new GameService(new InMemoryGameStore());
  return { gameService, session: new GameSession(gameService) };
}

test('join rejects an unknown code', async () => {
  const { session } = setup();

  const result = await session.join({ code: 'ZZZZZZ' });

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail('expected the join to fail');
  }
  assert.equal(result.code, 'GAME_NOT_FOUND');
});

test('join marks only the matching host token as host', async () => {
  const { gameService, session } = setup();
  const game = await gameService.createGame();

  const host = await session.join({ code: game.code, hostToken: game.hostToken });
  const guest = await session.join({ code: game.code, hostToken: 'not-the-token' });
  const anonymous = await session.join({ code: game.code });

  if (!host.ok || !guest.ok || !anonymous.ok) {
    assert.fail('expected all joins to succeed');
  }
  assert.equal(host.player.isHost, true);
  assert.equal(guest.player.isHost, false);
  assert.equal(anonymous.player.isHost, false);
});

test('join normalizes the code and assigns a unique player id', async () => {
  const { gameService, session } = setup();
  const game = await gameService.createGame();

  const first = await session.join({ code: `  ${game.code.toLowerCase()}  ` });
  const second = await session.join({ code: game.code });

  if (!first.ok || !second.ok) {
    assert.fail('expected all joins to succeed');
  }
  assert.equal(first.gameCode, game.code);
  assert.notEqual(first.player.id, second.player.id);
});

test('join rejects a game that has already started', async () => {
  const { gameService, session } = setup();
  const game = await gameService.createGame();
  await gameService.startGame(game.code);

  const result = await session.join({ code: game.code });

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail('expected the join to fail');
  }
  assert.equal(result.code, 'GAME_STARTED');
});

test('start rejects a non-host player', async () => {
  const { gameService, session } = setup();
  const game = await gameService.createGame();

  const result = await session.start({ code: game.code, isHost: false });

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail('expected start to fail');
  }
  assert.equal(result.code, 'NOT_HOST');
  assert.equal((await gameService.getGame(game.code))?.status, 'lobby');
});

test('start activates the game for the host', async () => {
  const { gameService, session } = setup();
  const game = await gameService.createGame();

  const result = await session.start({ code: game.code, isHost: true });

  assert.equal(result.ok, true);
  if (!result.ok) {
    assert.fail('expected start to succeed');
  }
  assert.equal(result.gameCode, game.code);
  assert.equal((await gameService.getGame(game.code))?.status, 'active');
});

test('start returns ALREADY_STARTED when the game is active', async () => {
  const { gameService, session } = setup();
  const game = await gameService.createGame();
  await gameService.startGame(game.code);

  const result = await session.start({ code: game.code, isHost: true });

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail('expected start to fail');
  }
  assert.equal(result.code, 'ALREADY_STARTED');
});

test('start returns GAME_NOT_FOUND for an unknown code', async () => {
  const { session } = setup();

  const result = await session.start({ code: 'ZZZZZZ', isHost: true });

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail('expected start to fail');
  }
  assert.equal(result.code, 'GAME_NOT_FOUND');
});
