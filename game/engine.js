export const WIDTH = 800;
export const HEIGHT = 480;

const PLAYER_RADIUS = 18;
const PLAYER_SPEED = 340;
const STARTING_LIVES = 3;
const INITIAL_SPAWN_DELAY = 0.8;

/** Return a fresh game state. Call this again to restart. */
export function initState() {
  return {
    player: { x: WIDTH / 2, y: HEIGHT - 38, r: PLAYER_RADIUS },
    meteors: [],
    score: 0,
    lives: STARTING_LIVES,
    elapsed: 0,
    spawnTimer: INITIAL_SPAWN_DELAY,
    status: 'playing',
  };
}

/** Circle collision, including touching edges. */
export function collides(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const radius = a.r + b.r;
  return dx * dx + dy * dy <= radius * radius;
}

/** Advance the game by dt seconds. input is -1, 0, or 1. */
export function step(state, input, dt, random = Math.random) {
  if (!Number.isFinite(dt) || dt < 0) {
    throw new RangeError('dt must be a nonnegative number of seconds');
  }

  if (state.status === 'over') {
    return {
      ...state,
      player: { ...state.player },
      meteors: state.meteors.map((meteor) => ({ ...meteor })),
    };
  }

  const direction = Number.isFinite(input) ? Math.sign(input) : 0;
  const player = {
    ...state.player,
    x: clamp(state.player.x + direction * PLAYER_SPEED * dt, state.player.r, WIDTH - state.player.r),
  };
  const elapsed = state.elapsed + dt;
  let score = state.score;
  let hit = false;
  const meteors = [];

  for (const meteor of state.meteors) {
    const moved = { ...meteor, y: meteor.y + meteor.speed * dt };
    if (moved.y - moved.r > HEIGHT) {
      score += 1;
    } else if (collides(player, moved)) {
      hit = true;
    } else {
      meteors.push(moved);
    }
  }

  const lives = Math.max(0, state.lives - (hit ? 1 : 0));
  let spawnTimer = state.spawnTimer - dt;
  if (lives > 0) {
    while (spawnTimer <= 0) {
      meteors.push(createMeteor(elapsed, random));
      spawnTimer += spawnInterval(elapsed);
    }
  }

  return {
    ...state,
    player,
    meteors,
    score,
    lives,
    elapsed,
    spawnTimer,
    status: lives > 0 ? 'playing' : 'over',
  };
}

function createMeteor(elapsed, random) {
  const r = 12 + random() * 16;
  return {
    x: r + random() * (WIDTH - 2 * r),
    y: -r,
    r,
    speed: 125 + random() * 95 + Math.min(elapsed * 2, 120),
  };
}

function spawnInterval(elapsed) {
  return Math.max(0.3, 0.9 - elapsed * 0.008);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
