import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { GameService } from '../../game/application/game-service.ts';
import { InMemoryGameStore } from '../../game/infrastructure/in-memory-game-store.ts';
import { JoinSession } from './join-session.ts';

function setup(): { gameService: GameService; session: JoinSession } {
  const gameService = new GameService(new InMemoryGameStore());
  return { gameService, session: new JoinSession(gameService) };
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
