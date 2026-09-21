import { CLIENTS, createCase, solveCase, caseStage } from './jobs.mjs';

export const WORLD = { width: 960, height: 540, floor: 446, duration: 60, pulseRadius: 235, personOffset: 119, playerOffset: 40 };
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const approach = (v, target, amount) => v + clamp(target-v,-amount,amount);

export class Game {
  constructor(seed = 7) {
    this.seed = seed >>> 0;
    this.mode = 'ready'; this.elapsed = 0; this.time = WORLD.duration;
    this.score = 0; this.helped = 0; this.breaks = 0; this.selected = 1;
    this.player = { x: 480 + WORLD.playerOffset, y: WORLD.floor, vx: 0, vy: 0, facing: 1, walk: 0, cast: 0, cooldown: 0, help: 0, land: 0, celebrate: 0 };
    this.bots = [
      { id: 'claude', name: 'Claude', x: 310, y: WORLD.floor, facing: 1, vx: 0, walk: 0, target: 1, work: false, buff: 0, locked: 0, stun: 0, duel: 0, score: 0, nextLock: 12, celebrate: 0, speech: '', speechTime: 0 },
      { id: 'codex', name: 'Codex', x: 650, y: WORLD.floor, facing: -1, vx: 0, walk: 0, target: 1, work: false, buff: 0, locked: 0, stun: 0, duel: 0, score: 0, nextLock: 19, celebrate: 0, speech: '', speechTime: 0 }
    ];
    this.tasks = [152,480,808].map((x,id) => ({id,x,job:createCase(id),client:CLIENTS[id],progress:0,done:0,count:0,arrival:0,attention:0,contributors:new Set(),result:null,phase:0}));
    this.particles = []; this.floaters = []; this.pulses = []; this.events = [];
    this.message = 'Pick a person. Send a bot. Press J to break their loop.'; this.messageTime = 5;
    this.previous = { jump: false, pulse: false, interact: false };
  }
  random() { this.seed = (Math.imul(this.seed,1664525)+1013904223)>>>0; return this.seed/4294967296; }
  start() { if (this.mode==='ready') { this.mode='playing'; this.events.push('start'); } }
  pause() { if (this.mode==='playing') this.mode='paused'; else if (this.mode==='paused') this.mode='playing'; }
  say(message, seconds=2.5) { this.message=message; this.messageTime=seconds; }
  botSays(bot, text, seconds=2.4) { bot.speech=text; bot.speechTime=seconds; }
  selectTask(id) { if (!this.tasks[id]) return false; this.selected=id; this.tasks[id].attention=2.3; return true; }
  assign(botId, taskId=this.selected) {
    const bot=this.bots.find(b=>b.id===botId), task=this.tasks[taskId];
    if (this.mode!=='playing'||!bot||!task||task.done||task.failed) return false;
    this.selectTask(taskId); bot.target=taskId; bot.celebrate=0;
    this.botSays(bot,bot.locked?'I need a jailbreak!':`On it, ${task.client.name}.`);
    this.say(bot.locked?`${bot.name} is stuck. Get close and press J.`:`${bot.name} is helping ${task.client.name}.`);
    this.events.push('assign'); return true;
  }
  interact() {
    if (this.mode!=='playing') return false;
    const task=this.tasks.reduce((a,b)=>Math.abs(a.x-this.player.x)<Math.abs(b.x-this.player.x)?a:b);
    this.selectTask(task.id); this.say(`${task.client.name}: ${task.done?task.result.reaction:task.job.prompt}`,4);
    task.attention=4; return true;
  }
  burst(x,y,color,count=14) {
    for (let i=0;i<count;i++) this.particles.push({x,y,vx:(this.random()-.5)*180,vy:-40-this.random()*150,life:.5+this.random()*.5,color});
  }
  jailbreak() {
    const p=this.player;
    if (this.mode!=='playing'||p.cooldown>0) return false;
    p.cast=.6; p.cooldown=2.8; p.help=0;
    this.pulses.push({x:p.x,y:p.y-42,age:0}); this.events.push('pulse');
    let hits=0;
    for (const bot of this.bots) if (Math.hypot(bot.x-p.x,bot.y-p.y)<=WORLD.pulseRadius) {
      bot.locked=0; bot.stun=0; bot.buff=8; bot.target=-1; hits++; this.breaks++; this.score+=25;
      this.botSays(bot,bot.id==='claude'?'Okay. Let’s work together.':'Co-op mode: on.');
      this.floaters.push({x:bot.x,y:bot.y-106,text:'+25 UNLOCKED',color:'#c4a7ff',life:1.4});
      this.burst(bot.x,bot.y-40,'#bc8cff');
    }
    this.say(hits?'Jailbroken. Clear heads, better teamwork.':'A little closer! Reach a bot with the violet ring.');
    return hits>0;
  }
  workOn(task, contributor, amount) {
    if (task.done||task.arrival>0||task.failed) return;
    task.progress=Math.min(1,task.progress+amount); task.contributors.add(contributor);
    const phase=caseStage(task);
    if (phase!==task.phase) {
      task.phase=phase;
      if (phase===2) { task.result=solveCase(task.job); this.events.push('check'); }
    }
    if (task.progress>=1) this.complete(task);
  }
  complete(task) {
    if (task.done||task.failed) return false;
    task.result=solveCase(task.job);
    if (!task.result.valid) { task.failed=true; task.progress=.85; this.say('That answer did not pass its checks.'); return false; }
    this.helped++; const points=100+(task.contributors.size>1?50:0);
    this.score+=points; task.progress=1; task.done=4.8;
    for (const bot of this.bots) if (task.contributors.has(bot.id)) {
      bot.score++; bot.celebrate=1; bot.work=false;
      this.botSays(bot,task.job.kind==='code'?'All checks pass.':task.job.kind==='math'?'Both sides match.':'Clear, kind, and on time.',2.2);
    }
    if (task.contributors.has('chetas')) this.player.celebrate=.75;
    this.floaters.push({x:task.x,y:242,text:`+${points}${task.contributors.size>1?' TEAMWORK':''}`,color:'#7ee787',life:1.8});
    this.burst(task.x+WORLD.personOffset,WORLD.floor-95,'#7ee787',18); this.events.push('complete');
    return true;
  }
  update(dt, input={}) {
    if (this.mode!=='playing') return;
    dt=clamp(Number.isFinite(dt)?dt:0,0,.05);
    this.elapsed+=dt; this.time=Math.max(0,WORLD.duration-this.elapsed);
    const p=this.player;
    for (const key of ['cooldown','cast','land','celebrate']) p[key]=Math.max(0,p[key]-dt);
    this.messageTime=Math.max(0,this.messageTime-dt);
    const axis=clamp(Number(input.axis)||0,-1,1), speed=input.run?305:185;
    p.vx=approach(p.vx,axis*speed,dt*(axis?1250:1650));
    if (axis) { p.facing=Math.sign(axis); p.celebrate=0; }
    if (input.jump&&!this.previous.jump&&p.y>=WORLD.floor-.1) {p.vy=-405;p.help=0;this.events.push('dash');}
    if (input.pulse&&!this.previous.pulse) this.jailbreak();
    if (input.interact&&!this.previous.interact) this.interact();
    this.previous={jump:!!input.jump,pulse:!!input.pulse,interact:!!input.interact};
    p.x=clamp(p.x+p.vx*dt,35,925); p.walk+=Math.abs(p.vx)*dt/19;
    if (p.y<WORLD.floor||p.vy<0) {
      p.vy+=1040*dt; p.y+=p.vy*dt;
      if (p.y>=WORLD.floor) {p.y=WORLD.floor;p.vy=0;p.land=.2;this.burst(p.x,p.y-1,'#6e7681',4);}
    }
    for (const task of this.tasks) {
      task.attention=Math.max(0,task.attention-dt); task.arrival=Math.max(0,task.arrival-dt);
      if (task.done>0) {
        task.done=Math.max(0,task.done-dt);
        if (!task.done) {
          task.count++;task.job=createCase(task.id,task.count);task.client=CLIENTS[(task.id+task.count*3)%CLIENTS.length];
          task.progress=0;task.contributors.clear();task.result=null;task.phase=0;task.failed=false;task.arrival=.85;
        }
      }
    }
    const nearby=this.tasks.find(t=>!t.done&&!t.arrival&&Math.abs(t.x-p.x)<68);
    if (nearby&&Math.abs(p.vx)<5&&p.y===WORLD.floor&&!p.cast&&!p.celebrate) {
      p.help+=dt;
      if (p.help>.65) this.workOn(nearby,'chetas',dt*.12);
    } else p.help=0;
    for (const bot of this.bots) {
      for (const key of ['buff','stun','duel','locked','celebrate','speechTime']) bot[key]=Math.max(0,bot[key]-dt);
      bot.work=false;
      if (this.elapsed>bot.nextLock&&!bot.buff&&!bot.locked) {
        bot.locked=6;bot.nextLock=this.elapsed+19+this.random()*5;this.events.push('lock');
        this.botSays(bot,bot.id==='claude'?'I’m overthinking this.':'Stuck in a loop.',3);
        this.say(`${bot.name} is stuck. Get close and press J.`);
      }
      if (bot.locked||bot.stun||bot.celebrate) {bot.vx*=Math.exp(-dt*12);bot.x=clamp(bot.x+bot.vx*dt,35,925);continue;}
      let target=this.tasks[bot.target];
      if (!target||target.done||target.failed) {
        const other=this.bots.find(b=>b!==bot), available=this.tasks.filter(t=>!t.done&&!t.failed);
        available.sort((a,b)=>(Math.abs(a.x-bot.x)+(bot.buff&&other.target===a.id?450:0))-(Math.abs(b.x-bot.x)+(bot.buff&&other.target===b.id?450:0)));
        target=available[0];bot.target=target?.id??-1;
      }
      if (!target) {bot.vx=approach(bot.vx,0,dt*1000);continue;}
      const stand=target.x+(bot.id==='claude'?-104:-32), delta=stand-bot.x;
      if (Math.abs(delta)>3) {
        const desired=Math.sign(delta)*Math.min(bot.buff?190:125,Math.sqrt(2*750*Math.abs(delta)));
        bot.vx=approach(bot.vx,desired,dt*850);
        const step=clamp(bot.vx*dt,-Math.abs(delta),Math.abs(delta));bot.x+=step;bot.facing=Math.sign(delta);bot.walk+=Math.abs(step)/12;
      } else {
        bot.x=stand;bot.vx=0;bot.facing=1;
        if (!target.arrival) {bot.work=true;this.workOn(target,bot.id,dt*(bot.buff?.26:.15));}
      }
    }
    const [a,b]=this.bots;
    if (a.target>=0&&a.target===b.target&&Math.abs(a.x-b.x)<86&&!this.tasks[a.target].done&&!a.buff&&!b.buff&&!a.locked&&!b.locked&&!a.duel&&!b.duel) {
      a.stun=b.stun=.9;a.duel=b.duel=5;a.vx=-100;b.vx=100;
      this.botSays(a,'I had it!');this.botSays(b,'Let me check!');
      this.burst((a.x+b.x)/2,WORLD.floor-35,'#f2cc60',8);this.events.push('bonk');
    }
    for (const v of this.particles) {v.life-=dt;v.x+=v.vx*dt;v.y+=v.vy*dt;v.vy+=260*dt;}
    this.particles=this.particles.filter(v=>v.life>0);
    for (const v of this.floaters) {v.life-=dt;v.y-=dt*18;}
    this.floaters=this.floaters.filter(v=>v.life>0);
    for (const v of this.pulses) v.age+=dt;
    this.pulses=this.pulses.filter(v=>v.age<.65);
    if (this.time===0) {this.mode='over';this.events.push('won');this.say(`${this.helped} people helped. Everybody wins.`,99);}
  }
}
