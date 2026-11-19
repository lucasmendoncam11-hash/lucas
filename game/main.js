import { HEIGHT, WIDTH, initState, step } from './engine.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const overlay = document.querySelector('#overlay');
const title = document.querySelector('#overlay-title');
const kicker = document.querySelector('#overlay-kicker');
const copy = document.querySelector('#overlay-copy');
const icon = document.querySelector('#overlay-icon');
const startButton = document.querySelector('#start-button');
const pauseButton = document.querySelector('#pause-button');
const scoreElement = document.querySelector('#score');
const livesElement = document.querySelector('#lives');
const bestElement = document.querySelector('#best-score');
const storageKey = 'fuga-espacial.recorde.v1';

let state = initState();
let started = false;
let paused = false;
let lastFrame = 0;
let pointerX = null;
let best = 0;
const keys = new Set();
const stars = Array.from({ length: 75 }, (_, index) => ({
  x: (index * 137.53) % WIDTH,
  y: (index * 93.71) % HEIGHT,
  r: index % 7 === 0 ? 1.6 : 0.7,
  speed: 8 + (index % 5) * 7,
}));

try { best = Number(localStorage.getItem(storageKey)) || 0; } catch { /* Storage is optional. */ }

function formatScore(value) { return String(value).padStart(3, '0'); }

function updateHud() {
  scoreElement.textContent = formatScore(state.score);
  bestElement.textContent = formatScore(best);
  livesElement.textContent = Array.from({ length: 3 }, (_, i) => i < state.lives ? '♥' : '♡').join(' ');
  livesElement.setAttribute('aria-label', `${state.lives} ${state.lives === 1 ? 'vida' : 'vidas'}`);
}

function showOverlay(mode) {
  const messages = {
    start: ['PRONTO PARA DECOLAR?', 'Sua missão começa agora.', 'Mova a nave para os lados e desvie dos meteoros.', 'Começar a jogar', '✦'],
    pause: ['MISSÃO EM ESPERA', 'Faça uma pausa.', 'Sua nave estará aqui quando você voltar.', 'Continuar jogando', 'Ⅱ'],
    over: ['FIM DE JOGO', `Você fez ${state.score} ${state.score === 1 ? 'ponto' : 'pontos'}!`, 'Cada tentativa é uma nova viagem. Vamos de novo?', 'Jogar novamente', '✧'],
  };
  [kicker.textContent, title.textContent, copy.textContent, startButton.firstChild.textContent, icon.textContent] = messages[mode];
  overlay.hidden = false;
}

function start() {
  if (paused) {
    paused = false;
  } else {
    state = initState();
  }
  started = true;
  pointerX = null;
  keys.clear();
  lastFrame = performance.now();
  overlay.hidden = true;
  pauseButton.disabled = false;
  pauseButton.textContent = 'Ⅱ';
  pauseButton.setAttribute('aria-label', 'Pausar jogo');
  updateHud();
}

function togglePause() {
  if (!started || state.status === 'over') return;
  paused = !paused;
  if (paused) {
    pauseButton.textContent = '▶';
    pauseButton.setAttribute('aria-label', 'Continuar jogo');
    showOverlay('pause');
  } else {
    lastFrame = performance.now();
    pauseButton.textContent = 'Ⅱ';
    pauseButton.setAttribute('aria-label', 'Pausar jogo');
    overlay.hidden = true;
  }
}

function drawBackground() {
  const background = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  background.addColorStop(0, '#09152c');
  background.addColorStop(1, '#122c47');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = '#1d3b553b';
  ctx.lineWidth = 1;
  for (let y = 60; y < HEIGHT; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
  }
  for (const star of stars) {
    const y = (star.y + state.elapsed * star.speed) % HEIGHT;
    ctx.beginPath();
    ctx.arc(star.x, y, star.r, 0, Math.PI * 2);
    ctx.fillStyle = star.r > 1 ? '#bceff3bb' : '#97c9de80';
    ctx.fill();
  }
  const glow = ctx.createRadialGradient(WIDTH / 2, HEIGHT + 45, 10, WIDTH / 2, HEIGHT + 45, 430);
  glow.addColorStop(0, '#246d7955'); glow.addColorStop(1, '#246d7900');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawShip() {
  const { x, y } = state.player;
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = '#5fe4e4'; ctx.shadowBlur = 22;
  ctx.fillStyle = '#67d9df';
  ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(-20, 17); ctx.lineTo(0, 9); ctx.lineTo(20, 17); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#e5ffff';
  ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(-5, 4); ctx.lineTo(5, 4); ctx.closePath(); ctx.fill();
  if (started && !paused && state.status === 'playing') {
    ctx.fillStyle = '#f5ad63';
    ctx.beginPath(); ctx.moveTo(-6, 14); ctx.lineTo(0, 28 + Math.sin(state.elapsed * 28) * 5); ctx.lineTo(6, 14); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawMeteor(meteor) {
  ctx.save(); ctx.translate(meteor.x, meteor.y);
  ctx.shadowColor = '#ff9c63'; ctx.shadowBlur = 13;
  ctx.fillStyle = '#c87055';
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const angle = i * Math.PI * 2 / 9;
    const radius = meteor.r * (i % 3 === 0 ? 1 : .82);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#e9a077';
  ctx.beginPath(); ctx.arc(-meteor.r * .23, -meteor.r * .2, meteor.r * .24, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function draw() {
  drawBackground();
  for (const meteor of state.meteors) drawMeteor(meteor);
  drawShip();
}

function direction() {
  const left = keys.has('ArrowLeft') || keys.has('a');
  const right = keys.has('ArrowRight') || keys.has('d');
  if (left !== right) return right ? 1 : -1;
  if (pointerX !== null && Math.abs(pointerX - state.player.x) > 5) return pointerX > state.player.x ? 1 : -1;
  return 0;
}

function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000 || 0, .05);
  lastFrame = now;
  if (started && !paused && state.status === 'playing') {
    state = step(state, direction(), dt);
    if (state.score > best) {
      best = state.score;
      try { localStorage.setItem(storageKey, String(best)); } catch { /* Storage is optional. */ }
    }
    updateHud();
    if (state.status === 'over') {
      pauseButton.disabled = true;
      showOverlay('over');
    }
  }
  draw();
  requestAnimationFrame(frame);
}

function setPointer(event) {
  const bounds = canvas.getBoundingClientRect();
  pointerX = Math.max(0, Math.min(WIDTH, (event.clientX - bounds.left) * WIDTH / bounds.width));
}

canvas.addEventListener('pointerdown', (event) => { canvas.setPointerCapture(event.pointerId); setPointer(event); });
canvas.addEventListener('pointermove', (event) => { if (event.buttons || event.pointerType === 'touch') setPointer(event); });
canvas.addEventListener('pointerup', () => { pointerX = null; });
canvas.addEventListener('pointercancel', () => { pointerX = null; });
window.addEventListener('keydown', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (['ArrowLeft', 'ArrowRight', ' ', 'a', 'd'].includes(key)) event.preventDefault();
  if (key === ' ' && !event.repeat) {
    if (!started || state.status === 'over') start(); else togglePause();
  }
  keys.add(key);
});
window.addEventListener('keyup', (event) => { keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key); });
window.addEventListener('blur', () => { keys.clear(); pointerX = null; if (started && !paused && state.status === 'playing') togglePause(); });
startButton.addEventListener('click', start);
pauseButton.addEventListener('click', togglePause);

updateHud();
showOverlay('start');
requestAnimationFrame(frame);
