import { Game, WORLD } from './engine.mjs';
import { Renderer } from './renderer.mjs';
import { Sound } from './audio.mjs';
import { caseStage, caseLines } from './jobs.mjs';

const byId = id => document.getElementById(id);
const canvas = byId('canvas'), panel = byId('game'), renderer = new Renderer(canvas, byId('person-face')), sound = new Sound();
const controls = { left: false, right: false, jump: false, pulse: false, run: false, interact: false };
const pressed = new Set();
const touch = new Map(), storageKey = 'chetas-claude-codex-best-v3';
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
function updateWorkbench() {
  const task = game.tasks[game.selected], phase = caseStage(task);
  const working = game.bots.filter(b => b.target === task.id && b.work).map(b => b.name);
  const state = task.failed ? 'CHECK FAILED' : task.done ? 'SOLVED' : task.progress > .73 ? 'CHECKING' : task.progress > .23 ? 'WORKING' : task.progress > 0 ? 'THINKING' : 'WAITING';
  setText('case-title', `${task.client.name} / ${task.job.title}`);
  setText('case-request', task.done ? `“${task.result.reaction}”` : `“${task.job.prompt}”`);
  setText('case-state', state); byId('case-state').dataset.state = state;
  let output = caseLines(task).join('\n');
  if (phase === 1) { const reveal = Math.floor(Math.max(0, (task.progress - .23) / .5) * output.length); output = output.slice(0, reveal) + '▍'; }
  setText('case-output', output);
  setText('case-caption', task.done ? task.result.summary : `${working.join(' + ') || (game.player.help > .65 && Math.abs(game.player.x-task.x)<68 ? 'Chetas' : 'Pick a bot')} · ${task.job.stages[Math.min(phase, 2)]}`);
  for (const b of document.querySelectorAll('[data-case]')) {
    const id = Number(b.dataset.case), other = game.tasks[id];
    const text = `${id + 1} · ${other.client.name} / ${other.job.kind}`;
    if (b.textContent !== text) b.textContent = text;
    b.setAttribute('aria-pressed', String(game.selected === id));
  }
  for (const b of document.querySelectorAll('[data-assign]')) b.disabled = game.mode !== 'playing' || !!task.done || !!task.failed;
}
function updateUI() {
  updateWorkbench();
  setText('score', String(game.score).padStart(4, '0')); setText('helped', game.helped); setText('time', Math.ceil(game.time));
  setText('charge', game.player.cooldown > 0 ? `${game.player.cooldown.toFixed(1)}s` : 'READY'); setText('best', `BEST ${String(best).padStart(4, '0')}`);
  byId('time').style.color = game.time <= 10 ? '#ffa198' : '';
  if (lastHelped !== game.helped && game.mode === 'playing') { lastHelped = game.helped; setText('live', `${game.helped} people helped. Score ${game.score}.`); }
  if (lastMode === game.mode) return;
  lastMode = game.mode;
  byId('intro').hidden = game.mode !== 'ready'; byId('workbench').hidden = game.mode === 'ready'; byId('overlay').hidden = !['paused', 'over'].includes(game.mode);
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
for (const button of document.querySelectorAll('[data-case]')) button.addEventListener('click', () => { game.selectTask(Number(button.dataset.case)); updateWorkbench(); });
for (const button of document.querySelectorAll('[data-assign]')) button.addEventListener('click', () => { game.assign(button.dataset.assign); updateWorkbench(); canvas.focus({preventScroll:true}); });
const keyNames = { e: 'interact', a: 'left', ArrowLeft: 'left', d: 'right', ArrowRight: 'right', ' ': 'jump', ArrowUp: 'jump', w: 'jump', j: 'pulse', Shift: 'run' };
const mapping = { KeyE: 'interact', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyJ: 'pulse', ShiftLeft: 'run', ShiftRight: 'run' };
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
  const x = (e.clientX - bounds.left) / bounds.width * WORLD.width, y = (e.clientY - bounds.top) / bounds.height * WORLD.height;
  const task = game.tasks.find(t => Math.abs(t.x - x) < 140);
  if (task) game.selectTask(task.id);
  if (y > 230) targetX = task && Math.abs(task.x + WORLD.personOffset - x) < 45 ? task.x + WORLD.playerOffset : x;
});
function frame(now) {
  const dt = last ? Math.min((now - last) / 1000, .05) : 0; last = now;
  const held = new Set([...touch.values(), ...pressed]);
  let axis = Number(controls.right || held.has('right')) - Number(controls.left || held.has('left'));
  if (targetX !== null) { const delta = targetX - game.player.x; if (Math.abs(delta) < 9) targetX = null; else axis = Math.sign(delta); }
  game.update(dt, { axis, jump: controls.jump || held.has('jump'), pulse: controls.pulse || held.has('pulse'), run: controls.run || held.has('run') || touch.size > 0 && (held.has('left') || held.has('right')), interact: controls.interact || held.has('interact') });
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
