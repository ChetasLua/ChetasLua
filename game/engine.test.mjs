import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, WORLD } from './engine.mjs';
import { createCase, solveCase, caseStage, caseLines } from './jobs.mjs';
const advance = (g, seconds, input = {}) => { for (let i = 0; i < Math.ceil(seconds * 60); i++) g.update(1 / 60, input); };
const playing = () => { const g = new Game(123); g.start(); return g; };
test('ready and paused rounds freeze the timer and characters', () => {
  const g = new Game(); advance(g, 2, { axis: 1 }); assert.equal(g.elapsed, 0); assert.equal(g.player.x, 520);
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
  const g = playing(); g.bots.forEach((b, i) => { b.target = 1; b.x = 480 + (i ? -32 : -104); }); g.update(.02); assert.ok(g.bots.every(b => b.stun > 0));
  const h = playing(); h.bots.forEach((b, i) => { b.target = 1; b.x = 480 + (i ? -32 : -104); b.buff = 4; }); h.update(.02); assert.ok(h.bots.every(b => b.stun === 0));
});
test('standing beside a person helps with the laptop; moving stops typing', () => { const g = playing(); g.bots.forEach(b => b.locked = 20); advance(g, 9.2); assert.equal(g.helped, 1); assert.equal(g.tasks[1].result.value, 5); advance(g, .2, { axis: 1 }); assert.equal(g.player.help, 0); });
test('completed requests score once, award teamwork, and respawn', () => {
  const g = playing(), t = g.tasks[0]; t.contributors.add('claude'); t.contributors.add('chetas'); g.complete(t); g.complete(t); assert.equal(g.helped, 1); assert.equal(g.score, 150); assert.equal(g.bots[0].score, 1);
  g.bots.forEach(b => b.locked = 20); advance(g, 4.9); assert.equal(t.done, 0); assert.equal(t.progress, 0); assert.equal(t.contributors.size, 0); assert.equal(t.client.name, 'Ravi'); assert.deepEqual(t.job.data, ['4','6','8']); assert.ok(t.arrival > 0);
  g.workOn(t, 'chetas', 1); assert.equal(t.progress, 0); advance(g, .9); g.workOn(t, 'chetas', .1); assert.equal(t.progress, .1);
});
test('the case engine calculates answers and validates code, algebra, and email', () => {
  for (let cycle=0;cycle<4;cycle++) {
    const code=createCase(0,cycle), math=createCase(1,cycle), email=createCase(2,cycle);
    assert.equal(solveCase(code).value,cycle%2?18:10); assert.equal(solveCase(code).checks,3);
    assert.equal(solveCase(math).value,cycle%2?7:5); assert.ok(solveCase(math).valid);
    assert.ok(solveCase(email).value.includes(email.expected)); assert.ok(solveCase(email).valid);
  }
  assert.equal(solveCase({kind:'unknown'}).valid,false);
});
test('incorrect answers cannot award points or trigger a success reaction', () => {
  for (const id of [0,1,2]) {
    const g=playing(), task=g.tasks[id]; task.job.expected='incorrect';
    g.workOn(task,'claude',1);
    assert.equal(task.failed,true); assert.equal(task.done,0); assert.equal(g.score,0); assert.equal(g.helped,0);
    assert.equal(g.events.includes('complete'),false); assert.equal(g.assign('codex',id),false);
  }
});
test('the visible solution moves through diagnosis, work, checked result, and reaction', () => {
  const g=playing(), task=g.tasks[0];
  assert.equal(caseStage(task),0); assert.deepEqual(caseLines(task),task.job.before);
  g.workOn(task,'claude',.4); assert.equal(caseStage(task),1); assert.deepEqual(caseLines(task),task.job.patch); assert.equal(task.result,null);
  g.workOn(task,'claude',.4); assert.equal(caseStage(task),2); assert.equal(task.result.value,10); assert.equal(g.events.filter(e=>e==='check').length,1);
  g.workOn(task,'claude',.2); assert.equal(caseStage(task),3); assert.match(task.result.reaction,/10/); assert.ok(g.bots[0].celebrate>0); assert.equal(g.bots[0].speech,'All checks pass.');
});
test('choosing a person and sending a bot changes where it walks and works', () => {
  const g=playing(); g.player.x=900; g.bots[1].locked=20;
  assert.equal(g.selectTask(0),true); assert.equal(g.assign('claude'),true); assert.equal(g.bots[0].target,0);
  advance(g,3); assert.ok(g.tasks[0].progress>0); assert.equal(g.bots[0].work,true); assert.ok(Math.abs(g.bots[0].x-48)<3);
  assert.equal(g.assign('claude',2),true); advance(g,1); assert.ok(g.bots[0].x>150); assert.equal(g.bots[0].target,2);
  g.pause(); assert.equal(g.assign('codex',1),false); assert.equal(g.assign('missing',1),false);
});
test('E selects the closest person and exposes their request or result', () => {
  const g=playing(); g.player.x=820; g.update(.01,{interact:true}); assert.equal(g.selected,2); assert.match(g.message,/Jules/); assert.match(g.message,/Friday/);
  g.complete(g.tasks[2]); g.update(.01,{}); g.update(.01,{interact:true}); assert.match(g.message,/sounds like me/);
});
test('the sixty second round ends and cannot continue scoring', () => {
  const g = playing(); advance(g, 60.1); assert.equal(g.mode, 'over'); assert.equal(g.time, 0); assert.ok(g.helped > 0); const score = g.score; advance(g, 30, { pulse: true }); assert.equal(g.score, score); assert.equal(g.jailbreak(), false);
});
test('suspended frames are capped and nonfinite input cannot corrupt positions', () => { const g = playing(); g.update(10, { axis: NaN }); assert.equal(g.elapsed, .05); assert.ok(Number.isFinite(g.player.x)); g.update(NaN); assert.ok(Number.isFinite(g.time)); });
