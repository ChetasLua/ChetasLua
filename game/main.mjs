import { Game, WORLD } from './engine.mjs';
import { Renderer } from './renderer.mjs';
import { Sound } from './audio.mjs';

const byId = id => document.getElementById(id);
const canvas = byId('canvas'), panel = byId('game'), renderer = new Renderer(canvas), sound = new Sound();
const controls = { left: false, right: false, jump: false, pulse: false, run: false };
const pressed = new Set();
const touch = new Map(), storageKey = 'chetas-claude-codex-best-v2';
let game = new Game(), best = 0, targetX = null, last = 0, lastMode = '', lastHelped = -1, ready = false;
try { best = Math.max(0, Number(localStorage.getItem(storageKey)) || 0); } catch {}
const setText = (id, value) => { if (byId(id).textContent !== String(value)) byId(id).textContent = value; };
const clearInput = () => { for (const key in controls) controls[key] = false; touch.clear(); pressed.clear(); targetX = null; document.querySelectorAll('[data-hold]').forEach(b => b.classList.remove('active')); };
function start() {
  if (!ready) return;
  clearInput(); game = new Game(Date.now()); game.start(); lastMode = ''; lastHelped = -1;
  sound.lastStep = 0; sound.quiet(false); canvas.focus({ preventScroll: true }); updateUI();
}
function pause() { game.pause(); clearInput(); sound.quiet(game.mode === 'paused'); updateUI(); }
function updateUI() {
  setText('score', String(game.score).padStart(4, '0')); setText('helped', game.helped); setText('time', Math.ceil(game.time));
  setText('charge', game.player.cooldown > 0 ? `${game.player.cooldown.toFixed(1)}s` : 'READY'); setText('best', `BEST ${String(best).padStart(4, '0')}`);
  byId('time').style.color = game.time <= 10 ? '#ffa198' : '';
  if (lastHelped !== game.helped && game.mode === 'playing') { lastHelped = game.helped; setText('live', `${game.helped} people helped. Score ${game.score}.`); }
  if (lastMode === game.mode) return;
  lastMode = game.mode;
  byId('intro').hidden = game.mode !== 'ready'; byId('overlay').hidden = !['paused', 'over'].includes(game.mode);
  byId('pause').disabled = !['playing', 'paused'].includes(game.mode); setText('pause', game.mode === 'paused' ? '[ resume ]' : '[ pause ]');
  if (game.mode === 'paused') { setText('overlay-kicker', 'TAKE A BREATHER'); setText('overlay-title', 'Paused'); setText('overlay-detail', 'The requests can wait.'); setText('resume', '[ resume ]'); byId('resume').focus({ preventScroll: true }); }
  if (game.mode === 'over') {
    best = Math.max(best, game.score); try { localStorage.setItem(storageKey, String(best)); } catch {}
    setText('best', `BEST ${String(best).padStart(4, '0')}`); setText('overlay-kicker', 'EVERYBODY WINS'); setText('overlay-title', `${game.helped} people helped.`);
    setText('overlay-detail', `${game.score} points · ${game.breaks} jailbreaks · best ${best}`); setText('resume', '[ play again ]');
    setText('live', `Round finished. ${game.helped} people helped. ${game.score} points. Best ${best}.`);
    clearInput(); byId('resume').focus({ preventScroll: true });
  }
}
byId('start').addEventListener('click', start);
byId('pause').addEventListener('click', () => { pause(); if (game.mode === 'playing') canvas.focus({ preventScroll: true }); });
byId('resume').addEventListener('click', () => { if (game.mode === 'over') start(); else { pause(); canvas.focus({ preventScroll: true }); } });
byId('sound').addEventListener('click', async () => {
  try { const on = await sound.toggle(); setText('sound', on ? '[ sound on ]' : '[ sound off ]'); byId('sound').setAttribute('aria-pressed', String(on)); sound.quiet(game.mode === 'paused'); }
  catch { setText('live', 'Audio is unavailable in this browser. The game is ready to play.'); }
});
const keyNames = { a: 'left', ArrowLeft: 'left', d: 'right', ArrowRight: 'right', ' ': 'jump', ArrowUp: 'jump', w: 'jump', j: 'pulse', Shift: 'run' };
const mapping = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyJ: 'pulse', ShiftLeft: 'run', ShiftRight: 'run' };
window.addEventListener('keydown', e => {
  if (!panel.contains(document.activeElement)) return;
  if ((e.code === 'Escape' || e.key === 'Escape') && !e.repeat && ['playing', 'paused'].includes(game.mode)) { e.preventDefault(); pause(); if (game.mode === 'playing') canvas.focus({ preventScroll: true }); return; }
  if (game.mode !== 'playing') return;
  const key = mapping[e.code] || keyNames[e.key] || keyNames[e.key?.toLowerCase()];
  if (key) { e.preventDefault(); controls[key] = true; if (!e.repeat) pressed.add(key); targetX = null; }
});
window.addEventListener('keyup', e => { const key = mapping[e.code] || keyNames[e.key] || keyNames[e.key?.toLowerCase()]; if (key) controls[key] = false; });
window.addEventListener('blur', () => { if (game.mode === 'playing') pause(); else clearInput(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && game.mode === 'playing') pause(); });
for (const button of document.querySelectorAll('[data-hold]')) {
  button.addEventListener('pointerdown', e => {
    e.preventDefault(); if (game.mode !== 'playing') return;
    button.setPointerCapture(e.pointerId); touch.set(e.pointerId, button.dataset.hold); pressed.add(button.dataset.hold); button.classList.add('active'); targetX = null;
    canvas.focus({ preventScroll: true });
  });
  const release = e => { touch.delete(e.pointerId); button.classList.remove('active'); };
  button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
}
canvas.addEventListener('pointerdown', e => {
  if (game.mode !== 'playing') return;
  canvas.focus({ preventScroll: true }); const bounds = canvas.getBoundingClientRect();
  targetX = (e.clientX - bounds.left) / bounds.width * WORLD.width;
});
function frame(now) {
  const dt = last ? Math.min((now - last) / 1000, .05) : 0; last = now;
  const held = new Set([...touch.values(), ...pressed]);
  let axis = Number(controls.right || held.has('right')) - Number(controls.left || held.has('left'));
  if (targetX !== null) { const delta = targetX - game.player.x; if (Math.abs(delta) < 9) targetX = null; else axis = Math.sign(delta); }
  game.update(dt, { axis, jump: controls.jump || held.has('jump'), pulse: controls.pulse || held.has('pulse'), run: controls.run || held.has('left') || held.has('right') });
  pressed.clear();
  while (game.events.length) sound.cue(game.events.shift());
  sound.update(game); renderer.render(game, now); updateUI(); requestAnimationFrame(frame);
}
renderer.load().then(() => {
  ready = true; byId('start').disabled = false; setText('start', '[ enter game ]');
  if (new URLSearchParams(location.search).get('play') === '1') start();
}).catch(error => {
  setText('start', '[ reload to retry ]'); byId('start').disabled = false;
  byId('start').addEventListener('click', () => location.reload(), { once: true });
  setText('live', 'A sprite sheet could not load. Reload to try again.'); console.error('Sprite loading failed:', error);
});
requestAnimationFrame(frame);
