import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HEIGHT, WIDTH, collides, initState, step } from './engine.js';

describe('meteor game engine', () => {
  it('starts and restarts with a fresh playable state', () => {
    const first = initState();
    const restarted = initState();

    assert.deepEqual(restarted, first);
    assert.notEqual(restarted, first);
    assert.notEqual(restarted.meteors, first.meteors);
    assert.equal(first.player.x, WIDTH / 2);
    assert.equal(first.lives, 3);
    assert.equal(first.status, 'playing');
  });

  it('moves horizontally, clamps at the edges, and leaves old state unchanged', () => {
    const initial = initState();
    const moved = step(initial, 1, 0.25);
    assert.equal(moved.player.x, initial.player.x + 85);
    assert.equal(initial.player.x, WIDTH / 2);
    assert.notEqual(moved.player, initial.player);

    const leftEdge = step({ ...initial, spawnTimer: 100 }, -1, 10);
    const rightEdge = step({ ...initial, spawnTimer: 100 }, 1, 10);
    assert.equal(leftEdge.player.x, initial.player.r);
    assert.equal(rightEdge.player.x, WIDTH - initial.player.r);
  });

  it('spawns a deterministic meteor when the timer expires', () => {
    const original = initState();
    const next = step(original, 0, 0.8, () => 0.5);

    assert.equal(original.meteors.length, 0);
    assert.equal(next.meteors.length, 1);
    assert.deepEqual(next.meteors[0], {
      x: WIDTH / 2,
      y: -20,
      r: 20,
      speed: 174.1,
    });
    assert.ok(next.spawnTimer > 0);
    assert.equal(next.elapsed, 0.8);
  });

  it('scores meteors that pass below the screen', () => {
    const original = {
      ...initState(),
      spawnTimer: 100,
      meteors: [{ x: 50, y: HEIGHT - 5, r: 10, speed: 40 }],
    };
    const next = step(original, 0, 1);

    assert.equal(next.score, 1);
    assert.deepEqual(next.meteors, []);
    assert.equal(original.score, 0);
    assert.equal(original.meteors.length, 1);
  });

  it('uses circle collision and loses one life per collision frame', () => {
    const player = initState().player;
    assert.equal(collides(player, { x: player.x + 30, y: player.y, r: 12 }), true);
    assert.equal(collides(player, { x: player.x + 31, y: player.y, r: 12 }), false);

    const meteor = { x: player.x, y: player.y, r: 12, speed: 0 };
    const state = { ...initState(), spawnTimer: 100, meteors: [meteor, { ...meteor }] };
    const next = step(state, 0, 0);

    assert.equal(next.lives, 2);
    assert.deepEqual(next.meteors, []);
    assert.equal(state.lives, 3);
  });

  it('ends at zero lives and stops advancing until restarted', () => {
    const initial = initState();
    const state = {
      ...initial,
      lives: 1,
      spawnTimer: 100,
      meteors: [{ x: initial.player.x, y: initial.player.y, r: 12, speed: 0 }],
    };
    const over = step(state, 0, 0.1);
    assert.equal(over.lives, 0);
    assert.equal(over.status, 'over');
    assert.deepEqual(over.meteors, []);

    const stopped = step(over, 1, 5);
    assert.deepEqual(stopped, over);
    assert.notEqual(stopped, over);
    assert.equal(initState().status, 'playing');
  });

  it('rejects invalid time steps', () => {
    assert.throws(() => step(initState(), 0, -1), RangeError);
    assert.throws(() => step(initState(), 0, Number.NaN), RangeError);
  });
});
