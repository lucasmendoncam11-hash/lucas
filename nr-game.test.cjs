const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');

const html = readFileSync(new URL('./index.html', `file://${__filename}`), 'utf8');
const start = html.indexOf('const MISSIONS = ');
const end = html.indexOf('// Interface, desenho e controles.', start);
assert.ok(start > 0 && end > start, 'o jogo deve conter dados e motor no próprio HTML');
const game = runInNewContext(`${html.slice(start, end)}; ({ MISSIONS, REGIONS, createGameState, currentRegion, currentLayout, missionsDone, canExit, updateGame, identifyMission, answerMission })`);

test('arquivo único contém 30 missões completas e cinco por NR', () => {
  assert.equal(game.MISSIONS.length, 30);
  assert.equal(new Set(game.MISSIONS.map(m => m.id)).size, 30);
  for (const region of game.REGIONS) {
    const missions = game.MISSIONS.filter(m => m.nr === region.nr);
    assert.equal(missions.length, 5, region.nr);
    for (const mission of missions) {
      assert.equal(mission.options.length, 4);
      assert.ok(mission.correct >= 0 && mission.correct < 4);
      assert.ok(mission.explanation.length > 10);
    }
  }
});

test('é possível concluir as 30 missões e vencer as seis regiões', () => {
  let state = game.createGameState({ difficulty: 'recruit' });
  for (let regionIndex = 0; regionIndex < 6; regionIndex++) {
    const region = game.currentRegion(state);
    assert.equal(region, regionIndex);
    for (let missionIndex = 0; missionIndex < 5; missionIndex++) {
      const point = game.currentLayout(state).markers[missionIndex];
      state.player = { ...state.player, ...point };
      state = game.identifyMission(state, missionIndex);
      state = game.answerMission(state, missionIndex, true);
    }
    assert.equal(game.missionsDone(state), 5);
    assert.equal(game.canExit(state), true);
    state.player = { ...state.player, x: 480, y: 55 };
    state = game.updateGame(state, { x: 0, y: 0 }, 0);
  }
  assert.equal(state.status, 'won');
  assert.equal(state.risksCorrected, 30);
  assert.equal(state.completedRegions, 6);
  assert.ok(state.score >= 16500);
});

test('erro reduz segurança e permite nova tentativa sem bônus de primeiro acerto', () => {
  let state = game.createGameState({ selectedRegions: [0] });
  state.player = { ...state.player, ...game.currentLayout(state).markers[0] };
  state = game.identifyMission(state, 0);
  state = game.answerMission(state, 0, false);
  assert.equal(state.security, 90);
  assert.equal(state.completed[0][0], false);
  state = game.answerMission(state, 0, true);
  assert.equal(state.completed[0][0], true);
  assert.equal(state.score, 300);
  assert.equal(state.errors.length, 1);
});

test('cronômetro encerra a partida', () => {
  let state = game.createGameState({ selectedRegions: [0], duration: 20 });
  for (let i = 0; i < 300 && state.status === 'playing'; i++) state = game.updateGame(state, { x: 0, y: 0 }, 0.07);
  assert.equal(state.status, 'lost');
  assert.equal(state.lastEvent, 'time');
});
