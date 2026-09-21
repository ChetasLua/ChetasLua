import { WORLD, clamp } from './engine.mjs';

const spriteFiles = {
  idle: new URL('../assets/chetas-idle.png', import.meta.url).href,
  walk: new URL('../assets/chetas-walk.png', import.meta.url).href,
  run: new URL('../assets/chetas-run.png', import.meta.url).href,
  actions: new URL('../assets/chetas-actions.png', import.meta.url).href
};
const mono = 'ui-monospace, SFMono-Regular, Consolas, monospace';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.atlases = {};
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    canvas.width = WORLD.width; canvas.height = WORLD.height;
  }
  async load() {
    await Promise.all(Object.entries(spriteFiles).map(async ([name, url]) => {
      const img = new Image(); img.src = url; await img.decode();
      const sheet = document.createElement('canvas'); sheet.width = img.width; sheet.height = img.height;
      const c = sheet.getContext('2d', { willReadFrequently: true }); c.drawImage(img, 0, 0);
      const pixels = c.getImageData(0, 0, sheet.width, sheet.height), d = pixels.data;
      // The generated source sheets use a deliberate magenta chroma key.
      for (let i = 0; i < d.length; i += 4) if (d[i] > 155 && d[i + 2] > 140 && d[i + 1] < 135 && d[i] + d[i + 2] > d[i + 1] * 3 + 120) d[i + 3] = 0;
      c.putImageData(pixels, 0, 0);
      const rows = name === 'actions' ? 4 : 2, frames = [];
      for (let n = 0; n < rows * 4; n++) {
        const cx = Math.round((n % 4) * sheet.width / 4), cy = Math.round(Math.floor(n / 4) * sheet.height / rows);
        const ex = Math.round((n % 4 + 1) * sheet.width / 4), ey = Math.round((Math.floor(n / 4) + 1) * sheet.height / rows);
        let l = ex, r = cx, t = ey, b = cy;
        for (let y = cy; y < ey; y++) for (let x = cx; x < ex; x++) if (d[(y * sheet.width + x) * 4 + 3] > 40) { l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y); }
        // Anchor at the head, so reaching arms and flowing robes do not shift the body.
        let sum = 0, count = 0;
        for (let y = Math.round(t + (b - t) * .15); y < t + (b - t) * .35; y++) for (let x = l; x <= r; x++) if (d[(y * sheet.width + x) * 4 + 3] > 128) { sum += x; count++; }
        frames.push({ x: l, y: t, w: r - l + 1, h: b - t + 1, anchor: count ? sum / count - l : (r - l) / 2 });
      }
      const heights = frames.map(f => f.h).sort((a, b) => a - b);
      this.atlases[name] = { sheet, frames, scale: 101 / heights[Math.floor(heights.length / 2)] };
    }));
  }
  rect(x, y, w, h, color) { this.ctx.fillStyle = color; this.ctx.fillRect(Math.round(x), Math.round(y), w, h); }
  text(s, x, y, size = 13, color = '#8b949e', align = 'center') { const c = this.ctx; c.fillStyle = color; c.font = `500 ${size}px ${mono}`; c.textAlign = align; c.fillText(s, x, y); }
  round(x, y, w, h, radius, fill, stroke) { const c = this.ctx; c.beginPath(); c.roundRect(x, y, w, h, radius); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.stroke(); } }
  shadow(x, y, w = 28) { const c = this.ctx; c.fillStyle = '#01040999'; c.beginPath(); c.ellipse(x, y + 3, w, 5, 0, 0, Math.PI * 2); c.fill(); }
  avatar(p, name, frame, height = 101) {
    const atlas = this.atlases[name]; if (!atlas) return;
    const f = atlas.frames[frame % atlas.frames.length], scale = atlas.scale * height / 101, c = this.ctx;
    this.shadow(p.x, p.ground ?? WORLD.floor, 25);
    c.save(); c.translate(Math.round(p.x), Math.round(p.y)); c.scale(p.facing || 1, 1); c.imageSmoothingEnabled = false;
    c.drawImage(atlas.sheet, f.x, f.y, f.w, f.h, -f.anchor * scale + 6, -f.h * scale, f.w * scale, f.h * scale); c.restore();
  }
  clawd(bot, t, big = 1) {
    const c = this.ctx, walk = Math.abs(bot.vx) > 1, phase = bot.walk || t * 4;
    const bounce = walk ? Math.abs(Math.sin(phase)) * 3 : Math.sin(t * 2) * .8;
    this.shadow(bot.x, bot.y, 30 * big);
    c.save(); c.translate(Math.round(bot.x), Math.round(bot.y - bounce)); c.scale(big * (bot.facing || 1), big);
    const r = (x, y, w, h, color) => this.rect(x, y, w, h, color);
    const orange = bot.locked ? '#9d7867' : '#d97757';
    const step = walk ? Math.sin(phase) * 5 : 0;
    r(-27, -55, 54, 39, '#a9573f'); r(-27, -55, 54, 34, orange);
    r(-34, -41 + (bot.work ? Math.sin(t * 18) * 2 : 0), 7, 15, orange); r(27, -41, 7, 15, orange);
    r(-23, -18, 8, 15 + step, orange); r(-10, -18, 8, 14 - step, orange); r(3, -18, 8, 14 + step, orange); r(16, -18, 8, 15 - step, orange);
    r(-16, -44, 7, (Math.sin(t * .7) > .996 ? 2 : 9), '#231c1a'); r(9, -44, 7, (Math.sin(t * .7) > .996 ? 2 : 9), '#231c1a');
    if (bot.work) { r(36, -30, 3, 3, '#ffa28b'); r(41, -35, 3, 3, '#ffa28b'); }
    c.restore();
  }
  codex(bot, t, big = 1) {
    const c = this.ctx, walking = Math.abs(bot.vx) > 1, phase = bot.walk || t * 3;
    const bounce = walking ? Math.abs(Math.sin(phase)) * 3 : Math.sin(t * 2 + 1) * 1.2;
    this.shadow(bot.x, bot.y, 29 * big);
    c.save(); c.translate(Math.round(bot.x), Math.round(bot.y - bounce)); c.scale(big * (bot.facing || 1), big);
    const r = (x, y, w, h, color) => this.rect(x, y, w, h, color);
    const blue = bot.locked ? '#72829e' : '#7196ff', deep = '#3c5cb6', ink = '#182c65';
    const step = walking ? Math.sin(phase) * 5 : 0;
    r(-15, -24, 30, 20, ink); r(-12, -24, 24, 17, blue);
    r(-17 - step, -10, 11, 10 + step, deep); r(6 + step, -10, 11, 10 - step, deep);
    r(-27, -23 + (bot.work ? Math.sin(t * 19) * 3 : step), 11, 11, deep); r(16, -23 - step, 11, 11, blue);
    const outline = [[-19,-78,34,7],[-27,-71,49,9],[-34,-62,65,11],[-39,-52,76,17],[-32,-35,63,11],[-21,-25,42,7]];
    for (const q of outline) r(...q, ink);
    const lobes = [[-17,-75,30,9],[-24,-68,44,12],[-31,-59,60,14],[-35,-50,68,12],[-28,-38,55,11],[-19,-28,37,7]];
    for (const q of lobes) r(...q, blue);
    r(-14,-72,24,3,'#a4b9ff'); r(-30,-55,5,10,'#9cb4ff'); r(27,-48,6,10,deep); r(-18,-26,36,4,deep);
    r(-25,-59,48,26,deep); r(-22,-58,42,24,'#0f1c39');
    r(-15,-51,4,3,'#75e5ff'); r(-11,-48,4,3,'#75e5ff'); r(-15,-45,4,3,'#75e5ff');
    if (!bot.locked && Math.floor(t * 2) % 5 !== 4) r(0,-43,11,3,'#75e5ff');
    r(-8,-20,16,9,ink); r(-5,-18,3,2,'#9adcff'); r(-2,-16,3,2,'#9adcff'); r(2,-14,4,2,'#9adcff');
    c.restore();
  }
  bot(bot, t, big = 1, labels = true) {
    if (bot.buff) { const c = this.ctx; c.strokeStyle = '#bc8cff'; c.lineWidth = 2; c.beginPath(); c.ellipse(bot.x, bot.y + 2, 37 * big, 7, 0, 0, Math.PI * 2); c.stroke(); }
    if (bot.id === 'claude') this.clawd(bot, t, big); else this.codex(bot, t, big);
    if (labels) {
      this.text(bot.name, bot.x, bot.y + 25, this.compact ? 20 : 12, bot.id === 'claude' ? '#e99b82' : '#93b1ff');
      if (bot.locked) { this.round(bot.x - 38, bot.y - 110, 76, 24, 4, '#241b27', '#614272'); this.text('stuck :(', bot.x, bot.y - 94, this.compact ? 18 : 11, '#d2a8ff'); }
      else if (bot.buff) this.text('unlocked', bot.x, bot.y - 97, this.compact ? 17 : 10, '#c4a7ff');
      else if (bot.stun) this.text('! # ?', bot.x, bot.y - 93, 17, '#f2cc60');
    }
  }
  person(task, t) {
    const x = task.x, y = WORLD.floor, c = this.ctx, colors = ['#5c9e89', '#c998d3', '#d0a16f'];
    const happy = task.done > 0, bob = happy && !this.reduced ? -Math.abs(Math.sin(t * 8)) * 5 : 0;
    this.shadow(x, y, 17); c.save(); c.translate(x, y + bob);
    this.rect(-10,-29,20,21,colors[task.id]); this.rect(-9,-8,7,8,'#63748e'); this.rect(3,-8,7,8,'#63748e');
    this.rect(-10,-50,20,20,['#e3b89c','#b47e62','#eac8a4'][task.id]); this.rect(-12,-54,23,9,['#3d3031','#222832','#967451'][task.id]);
    this.rect(-7,-43,3,3,'#27313d'); this.rect(5,-43,3,3,'#27313d'); this.rect(-4,-35,9,2,'#9e6959');
    const hands = happy ? -38 : -25; this.rect(-16,hands,6,13,colors[task.id]); this.rect(10,hands,6,13,colors[task.id]);
    c.restore();
    this.round(x - 97, 145, 194, 49, 7, happy ? '#12251c' : '#161b22', happy ? '#238636' : '#30363d');
    this.text(this.compact ? (happy ? 'Thanks!' : (task.label.includes('code') || task.label.includes('bug') ? 'Code' : task.label.includes('math') || task.label.includes('study') ? 'Study' : task.label.includes('CSS') ? 'CSS' : 'Email')) : (happy ? 'That worked. Thank you!' : task.label), x, 166, this.compact ? 22 : 12, happy ? '#7ee787' : '#c9d1d9');
    this.rect(x - 79, 178, 158, 3, '#30363d'); this.rect(x - 79, 178, 158 * clamp(task.progress, 0, 1), 3, happy ? '#7ee787' : '#6e7681');
    this.rect(x - 1, 194, 2, 9, '#30363d');
  }
  render(game, now = 0) {
    this.compact = this.canvas.clientWidth < 500;
    const c = this.ctx, t = this.reduced && game.mode !== 'playing' ? 0 : now / 1000;
    c.clearRect(0, 0, WORLD.width, WORLD.height); this.rect(0, 0, 960, 400, '#0d1117');
    this.rect(0, 327, 960, 73, '#11171e'); this.rect(0, 326, 960, 1, '#30363d');
    for (let x = 24; x < 960; x += 32) this.rect(x, 344, 2, 2, '#252d38');
    const ready = game.mode === 'ready';
    if (ready) {
      this.text('CLAUDE  ×  CODEX', 480, 70, this.compact ? 38 : 28, '#e6edf3');
      this.text('They fight to help. You jailbreak them.', 480, 105, this.compact ? 21 : 15, '#8b949e');
      this.bot({ ...game.bots[0], x: 310, y: 257, facing: 1 }, t, 1.3, false);
      this.avatar({ ...game.player, x: 485, y: 257, ground: 257 }, 'idle', Math.floor(t * 3) % 8, 121);
      this.bot({ ...game.bots[1], x: 653, y: 257, facing: 1 }, t, 1.3, false);
      this.text('CLAUDE', 310, 285, this.compact ? 20 : 12, '#e99b82'); this.text('CHETAS / YOU', 485, 285, this.compact ? 20 : 12, '#c4a7ff'); this.text('CODEX', 653, 285, this.compact ? 20 : 12, '#93b1ff');
      this.text('60 seconds. Help as many people as you can.', 480, 377, this.compact ? 19 : 13, '#6e7681');
      return;
    }
    this.text('HELP REQUESTS', 30, 37, this.compact ? 18 : 11, '#6e7681', 'left');
    this.text(`CLAUDE ${game.bots[0].score}    CODEX ${game.bots[1].score}`, 930, 37, this.compact ? 18 : 12, '#8b949e', 'right');
    for (const task of game.tasks) this.person(task, t);
    for (const pulse of game.pulses) {
      c.save(); c.globalAlpha = Math.max(0, 1 - pulse.age / .65); c.strokeStyle = '#bc8cff'; c.lineWidth = 3;
      c.beginPath(); c.ellipse(pulse.x, pulse.y, Math.min(WORLD.pulseRadius, pulse.age * 500), Math.min(105, pulse.age * 225), 0, 0, Math.PI * 2); c.stroke(); c.restore();
    }
    for (const bot of game.bots) this.bot(bot, t, this.compact ? 1.2 : 1);
    const p = game.player;
    let name = 'idle', frame = Math.floor(t * 3) % 8;
    if (game.mode === 'over') { name = 'actions'; frame = 12 + Math.floor(t * 4) % 4; }
    else if (p.cast > 0) { name = 'actions'; frame = 4 + clamp(Math.floor((.52 - p.cast) * 8), 0, 3); }
    else if (p.y < WORLD.floor) { name = 'actions'; frame = p.vy < -120 ? 1 : 2; }
    else if (p.land > 0) { name = 'actions'; frame = p.land > .06 ? 3 : 0; }
    else if (Math.abs(p.vx) > 12) { name = Math.abs(p.vx) > 220 ? 'run' : 'walk'; frame = Math.floor(p.walk) % 8; }
    else if (p.help > .65) { name = 'actions'; frame = 8 + Math.floor(t * 6) % 4; }
    this.avatar(p, name, frame, this.compact ? 136 : 101); this.text('YOU', p.x, p.y + 25, this.compact ? 20 : 11, '#c4a7ff');
    for (const v of game.particles) { c.globalAlpha = clamp(v.life * 2, 0, 1); this.rect(v.x, v.y, 3, 3, v.color); }
    c.globalAlpha = 1;
    for (const v of game.floaters) { c.globalAlpha = clamp(v.life * 2, 0, 1); this.text(this.compact ? v.text.replace('JAILBROKEN +25', '+25').replace('I CAN HELP!  NO, ME!', 'ME! NO, ME!').replace(' THANK YOU!', '').replace(' TEAMWORK', ' TEAM') : v.text, clamp(v.x, 130, 830), v.y, this.compact ? 21 : 11, v.color); }
    c.globalAlpha = 1;
    this.text(this.compact ? (game.bots.some(b => b.locked) ? 'Bot stuck? Get close and press J.' : 'Stand near people to help. J frees bots.') : (game.messageTime > 0 ? game.message : 'Stand near a person to help. Jailbreak bots to speed things up.'), 480, 382, this.compact ? 20 : 12, '#8b949e');
  }
}
