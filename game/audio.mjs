export class Sound {
  constructor() { this.enabled = false; this.context = null; this.master = null; this.lastStep = 0; }
  async toggle() {
    if (!this.context) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return false;
      this.context = new Audio(); this.master = this.context.createGain(); this.master.gain.value = 0; this.master.connect(this.context.destination);
    }
    this.enabled = !this.enabled;
    if (this.enabled) { await this.context.resume(); this.master.gain.setTargetAtTime(.24, this.context.currentTime, .12); this.cue('start'); }
    else this.master.gain.setTargetAtTime(0, this.context.currentTime, .08);
    return this.enabled;
  }
  quiet(on) { if (this.context) this.master.gain.setTargetAtTime(on || !this.enabled ? 0 : .24, this.context.currentTime, .08); }
  note(freq, duration = .12, delay = 0, type = 'sine', vol = .3, pan = 0) {
    if (!this.enabled || !this.context) return;
    const c = this.context, start = c.currentTime + delay, o = c.createOscillator(), v = c.createGain(), p = c.createStereoPanner();
    o.type = type; o.frequency.setValueAtTime(freq, start); v.gain.setValueAtTime(0, start); v.gain.linearRampToValueAtTime(vol, start + .008); v.gain.exponentialRampToValueAtTime(.001, start + duration); p.pan.value = pan;
    o.connect(v); v.connect(p); p.connect(this.master); o.start(start); o.stop(start + duration + .025);
    o.onended = () => { o.disconnect(); v.disconnect(); p.disconnect(); };
  }
  cue(type, pan = 0) {
    if (type === 'pulse') [220,330,440,660,880].forEach((f,i)=>this.note(f,.22,i*.047,'triangle',.22,pan));
    else if (type === 'complete') [392,494,587,784].forEach((f,i)=>this.note(f,.27,i*.07,'sine',.28,pan));
    else if (type === 'token') { this.note(1175,.09,0,'sine',.22,pan); this.note(1568,.15,.055,'sine',.2,pan); }
    else if (type === 'lock') { this.note(174,.14,0,'triangle',.3,pan); this.note(130,.18,.12,'triangle',.22,pan); }
    else if (type === 'bonk') { this.note(98,.1,0,'triangle',.5,pan); this.note(73,.14,.06,'sine',.3,pan); }
    else if (type === 'dash') [440,330,220].forEach((f,i)=>this.note(f,.055,i*.023,'sine',.12,pan));
    else if (type === 'won') [262,330,392,523,659,784,1047].forEach((f,i)=>this.note(f,.5,i*.10,'triangle',.2,pan));
    else if (type === 'lost') [392,330,294,262].forEach((f,i)=>this.note(f,.4,i*.16,'sine',.2,pan));
    else if (type === 'start') [262,392,523].forEach((f,i)=>this.note(f,.3,i*.08,'sine',.2,pan));
  }
  update(g) {
    if (!this.enabled || g.mode !== 'playing') return;
    if (Math.hypot(g.player.vx,g.player.vy)>20 && g.elapsed-this.lastStep>.27) { this.lastStep=g.elapsed; this.note(90+(Math.floor(g.player.walk)%2)*18,.045,0,'triangle',.15); }
  }
}
