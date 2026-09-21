import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, WORLD } from './engine.mjs';
const advance = (g, seconds, input = {}) => { for (let i = 0; i < Math.ceil(seconds * 60); i++) g.update(1 / 60, input); };
const playing = () => { const g = new Game(123); g.start(); return g; };
test('ready and paused rounds freeze the timer and characters', () => {
  const g = new Game(); advance(g, 2, { axis: 1 }); assert.equal(g.elapsed, 0); assert.equal(g.player.x, 480);
  g.start(); advance(g, 1); g.pause(); const snapshot = JSON.stringify(g); advance(g, 2, { axis: 1, pulse: true }); assert.equal(JSON.stringify(g), snapshot); g.pause(); advance(g, 1); assert.ok(g.elapsed > 1.9);
});
test('movement accelerates, running is faster, and stage edges contain the player', () => {
  const a = playing(), b = playing(); advance(a, 1, { axis: 1 }); advance(b, 1, { axis: 1, run: true }); assert.ok(b.player.x > a.player.x + 80);
  advance(b, 10, { axis: 1, run: true }); assert.equal(b.player.x, 925); advance(b, 10, { axis: -1, run: true }); assert.equal(b.player.x, 35);
});
test('jump rises, lands, and holding the key does not repeat', () => {
  const g = playing(); advance(g, .2, { jump: true }); assert.ok(g.player.y < WORLD.floor - 30); advance(g, 2, { jump: true }); assert.equal(g.player.y, WORLD.floor); assert.equal(g.player.vy, 0);
  g.update(1 / 60, {}); g.update(1 / 60, { jump: true }); assert.ok(g.player.vy < 0);
});
test('jailbreak reaches nearby bots, clears their lock and enables cooperation', () => {
  const g = playing(); g.bots[0].locked = 5; assert.equal(g.jailbreak(), true); assert.equal(g.breaks, 2); assert.equal(g.score, 50);
  assert.ok(g.bots.every(b => b.buff === 8 && b.locked === 0)); g.update(1 / 60); assert.notEqual(g.bots[0].target, g.bots[1].target);
});
test('out-of-range pulses have no hit and cooldown prevents score farming by repeats', () => {
  const g = playing(); g.player.x = 35; g.bots.forEach(b => b.x = 800); assert.equal(g.jailbreak(), false); assert.equal(g.breaks, 0);
  g.bots[0].x = 40; assert.equal(g.jailbreak(), false); assert.equal(g.score, 0); advance(g, 3); g.bots[0].x = 40; assert.equal(g.jailbreak(), true);
});
test('a held J casts once until released', () => { const g = playing(); advance(g, 8, { pulse: true }); assert.equal(g.breaks, 2); });
test('competing bots bonk; jailbroken bots do not', () => {
  const g = playing(); g.bots.forEach((b, i) => { b.target = 1; b.x = 480 + (i ? 52 : -52); }); g.update(.02); assert.ok(g.bots.every(b => b.stun > 0));
  const h = playing(); h.bots.forEach((b, i) => { b.target = 1; b.x = 480 + (i ? 52 : -52); b.buff = 4; }); h.update(.02); assert.ok(h.bots.every(b => b.stun === 0));
});
test('standing beside a person helps with the laptop; moving stops typing', () => { const g = playing(); g.bots.forEach(b => b.locked = 20); advance(g, 8); assert.ok(g.helped >= 1); advance(g, .2, { axis: 1 }); assert.equal(g.player.help, 0); });
test('completed requests score once, award teamwork, and respawn', () => {
  const g = playing(), t = g.tasks[0]; t.contributors.add('claude'); t.contributors.add('chetas'); g.complete(t); g.complete(t); assert.equal(g.helped, 1); assert.equal(g.score, 150); assert.equal(g.bots[0].score, 1);
  g.bots.forEach(b => b.locked = 20); advance(g, 2.4); assert.equal(t.done, 0); assert.equal(t.progress, 0); assert.equal(t.contributors.size, 0); assert.equal(t.label, 'Find this bug');
});
test('the sixty second round ends and cannot continue scoring', () => {
  const g = playing(); advance(g, 60.1); assert.equal(g.mode, 'over'); assert.equal(g.time, 0); assert.ok(g.helped > 0); const score = g.score; advance(g, 30, { pulse: true }); assert.equal(g.score, score); assert.equal(g.jailbreak(), false);
});
test('suspended frames are capped and nonfinite input cannot corrupt positions', () => { const g = playing(); g.update(10, { axis: NaN }); assert.equal(g.elapsed, .05); assert.ok(Number.isFinite(g.player.x)); g.update(NaN); assert.ok(Number.isFinite(g.time)); });
