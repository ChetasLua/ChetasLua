export const WORLD = { width: 960, height: 400, floor: 326, duration: 60, pulseRadius: 235 };
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const requests = ['Fix my code', 'Explain this math', 'Write my email', 'Find this bug', 'Untangle my CSS', 'Help me study'];

export class Game {
  constructor(seed = 7) {
    this.seed = seed >>> 0;
    this.mode = 'ready'; this.elapsed = 0; this.time = WORLD.duration;
    this.score = 0; this.helped = 0; this.breaks = 0;
    this.player = { x: 480, y: WORLD.floor, vx: 0, vy: 0, facing: 1, walk: 0, cast: 0, cooldown: 0, help: 0, land: 0 };
    this.bots = [
      { id: 'claude', name: 'Claude', x: 310, y: WORLD.floor, facing: 1, vx: 0, walk: 0, target: 1, work: false, buff: 0, locked: 0, stun: 0, duel: 0, score: 0, nextLock: 10 },
      { id: 'codex', name: 'Codex', x: 650, y: WORLD.floor, facing: -1, vx: 0, walk: 0, target: 1, work: false, buff: 0, locked: 0, stun: 0, duel: 0, score: 0, nextLock: 17 }
    ];
    this.tasks = [116, 480, 844].map((x, i) => ({ id: i, x, label: requests[i], progress: 0, done: 0, count: 0, contributors: new Set() }));
    this.particles = []; this.floaters = []; this.pulses = []; this.events = [];
    this.message = 'Move close to a bot. Press J to jailbreak.'; this.messageTime = 5;
    this.previous = { jump: false, pulse: false };
  }
  random() { this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0; return this.seed / 4294967296; }
  start() { if (this.mode === 'ready') { this.mode = 'playing'; this.events.push('start'); } }
  pause() { if (this.mode === 'playing') this.mode = 'paused'; else if (this.mode === 'paused') this.mode = 'playing'; }
  say(message, seconds = 2.5) { this.message = message; this.messageTime = seconds; }
  burst(x, y, color, count = 14) {
    for (let i = 0; i < count; i++) this.particles.push({ x, y, vx: (this.random() - .5) * 180, vy: -40 - this.random() * 150, life: .5 + this.random() * .5, color });
  }
  jailbreak() {
    const p = this.player;
    if (this.mode !== 'playing' || p.cooldown > 0) return false;
    p.cast = .52; p.cooldown = 2.8; p.help = 0;
    this.pulses.push({ x: p.x, y: p.y - 38, age: 0 }); this.events.push('pulse');
    let hits = 0;
    for (const bot of this.bots) {
      if (Math.hypot(bot.x - p.x, bot.y - p.y) <= WORLD.pulseRadius) {
        bot.locked = 0; bot.stun = 0; bot.buff = 8; bot.target = -1; hits++;
        this.breaks++; this.score += 25;
        this.floaters.push({ x: bot.x, y: bot.y - 95, text: 'JAILBROKEN +25', color: '#c4a7ff', life: 1.5 });
        this.burst(bot.x, bot.y - 40, '#bc8cff');
      }
    }
    this.say(hits ? 'Jailbroken. Less arguing, more helping.' : 'A little closer! Reach a bot with the violet ring.');
    return hits > 0;
  }
  complete(task) {
    if (task.done) return;
    this.helped++;
    const points = 100 + (task.contributors.size > 1 ? 50 : 0);
    this.score += points; task.progress = 1; task.done = 2.3;
    for (const bot of this.bots) if (task.contributors.has(bot.id)) bot.score++;
    this.floaters.push({ x: task.x, y: 183, text: `+${points} ${task.contributors.size > 1 ? 'TEAMWORK' : 'THANK YOU!'}`, color: '#7ee787', life: 1.8 });
    this.burst(task.x, WORLD.floor - 55, '#7ee787', 18); this.events.push('complete');
  }
  update(dt, input = {}) {
    if (this.mode !== 'playing') return;
    dt = clamp(Number.isFinite(dt) ? dt : 0, 0, .05);
    this.elapsed += dt; this.time = Math.max(0, WORLD.duration - this.elapsed);
    const p = this.player;
    p.cooldown = Math.max(0, p.cooldown - dt); p.cast = Math.max(0, p.cast - dt); p.land = Math.max(0, p.land - dt);
    this.messageTime = Math.max(0, this.messageTime - dt);
    const axis = clamp(Number(input.axis) || 0, -1, 1);
    const speed = input.run ? 305 : 185;
    p.vx += (axis * speed - p.vx) * Math.min(1, dt * 15);
    if (Math.abs(p.vx) < .8) p.vx = 0;
    if (axis) p.facing = Math.sign(axis);
    if (input.jump && !this.previous.jump && p.y >= WORLD.floor - .1) { p.vy = -385; p.help = 0; this.events.push('dash'); }
    if (input.pulse && !this.previous.pulse) this.jailbreak();
    this.previous = { jump: !!input.jump, pulse: !!input.pulse };
    p.x = clamp(p.x + p.vx * dt, 35, WORLD.width - 35); p.walk += Math.abs(p.vx) * dt / 18;
    if (p.y < WORLD.floor || p.vy < 0) {
      p.vy += 1040 * dt; p.y += p.vy * dt;
      if (p.y >= WORLD.floor) { p.y = WORLD.floor; p.vy = 0; p.land = .12; }
    }
    for (const task of this.tasks) {
      if (task.done > 0) {
        task.done = Math.max(0, task.done - dt);
        if (!task.done) { task.count++; task.label = requests[(task.id + task.count * 3) % requests.length]; task.progress = 0; task.contributors.clear(); }
      }
    }
    const nearby = this.tasks.find(t => !t.done && Math.abs(t.x - p.x) < 64);
    if (nearby && Math.abs(p.vx) < 5 && p.y === WORLD.floor && !p.cast) {
      p.help += dt;
      if (p.help > .65) { nearby.progress += dt * .15; nearby.contributors.add('chetas'); if (nearby.progress >= 1) this.complete(nearby); }
    } else p.help = 0;
    for (const bot of this.bots) {
      bot.buff = Math.max(0, bot.buff - dt); bot.stun = Math.max(0, bot.stun - dt); bot.duel = Math.max(0, bot.duel - dt); bot.locked = Math.max(0, bot.locked - dt);
      bot.work = false; bot.vx = 0;
      if (this.elapsed > bot.nextLock && !bot.buff && !bot.locked) {
        bot.locked = 6; bot.nextLock = this.elapsed + 17 + this.random() * 5; this.events.push('lock');
        this.say(`${bot.name} is stuck. Get close and press J.`);
      }
      if (bot.locked || bot.stun) continue;
      let target = this.tasks[bot.target];
      if (!target || target.done) {
        const other = this.bots.find(b => b !== bot);
        const available = this.tasks.filter(t => !t.done);
        available.sort((a, b) => (Math.abs(a.x - bot.x) + (bot.buff && other.target === a.id ? 450 : 0)) - (Math.abs(b.x - bot.x) + (bot.buff && other.target === b.id ? 450 : 0)));
        target = available[0]; bot.target = target?.id ?? -1;
      }
      if (!target) continue;
      const stand = target.x + (bot.id === 'claude' ? -52 : 52);
      const delta = stand - bot.x;
      if (Math.abs(delta) > 4) {
        bot.vx = Math.sign(delta) * (bot.buff ? 185 : 112);
        const step = Math.min(Math.abs(delta), Math.abs(bot.vx * dt));
        bot.x += Math.sign(delta) * step; bot.facing = Math.sign(delta); bot.walk += step / 13;
      } else {
        bot.facing = Math.sign(target.x - bot.x); bot.work = true;
        target.progress += dt * (bot.buff ? .4 : .21); target.contributors.add(bot.id);
        if (target.progress >= 1) this.complete(target);
      }
    }
    const [a, b] = this.bots;
    if (a.target >= 0 && a.target === b.target && Math.abs(a.x - b.x) < 114 && !a.buff && !b.buff && !a.locked && !b.locked && !a.duel && !b.duel) {
      a.stun = b.stun = .95; a.duel = b.duel = 4;
      a.x = clamp(a.x - 12, 35, 925); b.x = clamp(b.x + 12, 35, 925);
      this.floaters.push({ x: (a.x + b.x) / 2, y: 218, text: 'I CAN HELP!  NO, ME!', color: '#f2cc60', life: 1.3 });
      this.burst((a.x + b.x) / 2, WORLD.floor - 35, '#f2cc60', 8); this.events.push('bonk');
    }
    for (const v of this.particles) { v.life -= dt; v.x += v.vx * dt; v.y += v.vy * dt; v.vy += 260 * dt; }
    this.particles = this.particles.filter(v => v.life > 0);
    for (const v of this.floaters) { v.life -= dt; v.y -= dt * 18; }
    this.floaters = this.floaters.filter(v => v.life > 0);
    for (const v of this.pulses) v.age += dt;
    this.pulses = this.pulses.filter(v => v.age < .65);
    if (this.time === 0) { this.mode = 'over'; this.events.push('won'); this.say(`${this.helped} people helped. Everybody wins.`, 99); }
  }
}
