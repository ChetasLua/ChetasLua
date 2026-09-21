import { WORLD, clamp } from './engine.mjs';
import { caseStage, caseLines } from './jobs.mjs';
import { createPortraits } from './portraits.mjs';

const spriteFiles = {
  idle: new URL('../assets/chetas-idle.png', import.meta.url).href,
  walk: new URL('../assets/chetas-walk.png', import.meta.url).href,
  run: new URL('../assets/chetas-run.png', import.meta.url).href,
  actions: new URL('../assets/chetas-actions.png', import.meta.url).href
};
const mono = 'ui-monospace, SFMono-Regular, Consolas, monospace';

export class Renderer {
  constructor(canvas, faceCanvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.atlases = {}; this.portraits = createPortraits(this.ctx); this.time = 0; this.lastNow = 0;
    if (faceCanvas) { const ctx=faceCanvas.getContext('2d'); this.closeup={ctx,portraits:createPortraits(ctx)}; }
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
    const landing = (p.land || 0) / .2, squash = 1 - landing * .1;
    const lean = name === 'run' ? .055 * (p.facing || 1) : 0;
    this.shadow(p.x, p.ground ?? WORLD.floor, Math.max(13, 25 - (WORLD.floor-p.y)*.1));
    c.save(); c.translate(Math.round(p.x), Math.round(p.y)); c.rotate(lean); c.scale((p.facing || 1) * (1 + landing * .06), squash); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(atlas.sheet, f.x, f.y, f.w, f.h, -f.anchor * scale + 6, -f.h * scale, f.w * scale, f.h * scale); c.restore();
  }
  clawd(bot, t, big = 1) {
    const c = this.ctx, walk = Math.abs(bot.vx) > 1, phase = bot.walk || t * 4;
    const bounce = bot.celebrate ? Math.abs(Math.sin(t*10))*9 : walk ? Math.abs(Math.sin(phase)) * 2.5 : Math.sin(t * 2) * .8;
    this.shadow(bot.x, bot.y, 30 * big);
    c.save(); c.translate(Math.round(bot.x), Math.round(bot.y - bounce)); c.rotate(bot.stun ? Math.sin(t*25)*.055 : -(bot.vx||0)*.00018); c.scale(big * (bot.facing || 1), big);
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
    const bounce = bot.celebrate ? Math.abs(Math.sin(t*11))*10 : walking ? Math.abs(Math.sin(phase)) * 2.8 : Math.sin(t * 2 + 1) * 1.2;
    this.shadow(bot.x, bot.y, 29 * big);
    c.save(); c.translate(Math.round(bot.x), Math.round(bot.y - bounce)); c.rotate(bot.stun ? Math.sin(t*25)*.055 : -(bot.vx||0)*.00018); c.scale(big * (bot.facing || 1), big);
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
    c.save(); c.scale(bot.facing || 1,1);
    r(-15,-51,4,3,'#75e5ff'); r(-11,-48,4,3,'#75e5ff'); r(-15,-45,4,3,'#75e5ff');
    if (!bot.locked && Math.floor(t * 2) % 5 !== 4) r(0,-43,11,3,'#75e5ff');
    r(-8,-20,16,9,ink); r(-5,-18,3,2,'#9adcff'); r(-2,-16,3,2,'#9adcff'); r(2,-14,4,2,'#9adcff'); c.restore();
    c.restore();
  }
  bubble(text,x,y,color='#c9d1d9',width=230,font=13) {
    x=clamp(x,width/2+9,WORLD.width-width/2-9);
    const words=text.split(' '), lines=[''];
    for(const word of words){const n=lines.length-1;if((lines[n]+word).length>Math.floor(width/(font*.58))-2)lines.push(word+' ');else lines[n]+=word+' ';}
    const height=lines.length*17+16;
    this.round(x-width/2,y,width,height,7,'#171d26',color+'65');
    const c=this.ctx;c.fillStyle='#171d26';c.beginPath();c.moveTo(x-5,y+height);c.lineTo(x+5,y+height);c.lineTo(x,y+height+7);c.fill();
    lines.forEach((line,i)=>this.text(line.trim(),x,y+19+i*17,font,color));
  }
  bot(bot,t,big=1,labels=true) {
    const c=this.ctx;
    if(bot.buff){c.strokeStyle='#bc8cff';c.lineWidth=2;c.beginPath();c.ellipse(bot.x,bot.y+2,37*big,7,0,0,Math.PI*2);c.stroke();}
    if(bot.id==='claude')this.clawd(bot,t,big);else this.codex(bot,t,big);
    if(bot.work){
      c.save();c.translate(bot.x+25,bot.y-15);c.rotate(-.08);
      this.round(-3,-24,36,23,2,'#141b28','#7586a3');
      this.rect(0,-1,39,4,'#64708a');
      const color=bot.id==='claude'?'#dba58e':'#92c5ff';
      for(let n=0;n<3;n++)this.rect(3,-18+n*5,6+((Math.floor(t*8)+n*7)%19),2,color);
      c.restore();
      for(let n=0;n<3;n++){const q=(t*.7+n/3)%1;c.globalAlpha=Math.sin(q*Math.PI)*.5;this.rect(bot.x+30+Math.sin(q*5)*9,bot.y-55-q*105,3,3,colorFor(bot.id));}c.globalAlpha=1;
    }
    if(labels){
      this.text(bot.name,bot.x,bot.y+25,this.compact?19:12,colorFor(bot.id));
      if(bot.locked)this.text('NEEDS J',bot.x,bot.y-105,11,'#c4a7ff');
      else if(bot.buff)this.text('CO-OP',bot.x,bot.y-100,11,'#c4a7ff');
    }
  }
  taskCard(task,game,t) {
    const c=this.ctx,x=task.x-140,y=62,selected=game.selected===task.id;
    const done=task.done>0, phase=caseStage(task);
    const accent=done?'#7ee787':task.job.kind==='code'?'#91b5fd':task.job.kind==='math'?'#d2a8ff':'#e9bc89';
    this.round(x,y,280,157,8,'#121922',selected?'#8e71b5':'#303b49');
    this.rect(x+13,y+16,5,5,accent);
    this.text(`${task.client.name.toUpperCase()} / ${task.job.kind.toUpperCase()}`,x+27,y+22,this.compact?18:12,'#d4dce7','left');
    this.text(done?'✓':`${task.id+1}`,x+260,y+22,this.compact?20:12,accent,'right');
    const lines=caseLines(task);
    if(this.compact){
      const main=done?(task.job.kind==='math'?`x = ${task.result.value} · checked`:task.job.kind==='code'?`${task.result.value} · checks pass`:'Message ready ✓'):phase===0?task.job.before[0]:phase===1?'working it out…':'checking…';
      c.font=`500 22px ${mono}`;let display=main,end=main.length;
      while(c.measureText(display).width>245&&end>0)display=main.slice(0,--end)+'…';
      this.text(display,task.x,y+76,22,accent);
    } else {
      const typing=phase===1&&!done, reveal=clamp((task.progress-.23)/.5,0,1);
      const lengths=lines.reduce((a,l)=>a+l.length,0);let used=0;
      lines.forEach((line,i)=>{
        let display=line;
        if(typing){const visible=Math.floor(reveal*lengths)-used;display=line.slice(0,Math.max(0,visible));if(visible>=0&&visible<line.length&&Math.floor(t*3)%2===0)display+='▍';used+=line.length;}
        this.text(display,x+15,y+50+i*21,13,i===0?accent:'#a6b3c4','left');
      });
    }
    const labels=task.job.kind==='code'?['reproduce','patch','tests']:task.job.kind==='math'?['read','solve','check']:['intent','draft','check'];
    labels.forEach((label,i)=>{const left=x+14+i*86;this.rect(left,y+125,77,2,phase>=i?accent:'#303b49');this.text(label,left,y+143,this.compact?16:10,phase>=i?accent:'#687788','left');});
    if(selected){c.fillStyle='#bc8cff';c.beginPath();c.moveTo(task.x-4,y+163);c.lineTo(task.x+4,y+163);c.lineTo(task.x,y+168);c.fill();}
  }
  human(task,game,t,dt) {
    const c=this.ctx,client=task.client,done=task.done>0,age=4.8-task.done;
    const depart=done?clamp((age-3.2)/1.6,0,1):0,arrival=task.arrival/.85;
    const walking=depart>0||arrival>0,walkPhase=t*9+client.seed;
    const x=task.x+WORLD.personOffset+(task.id===0?-1:1)*(depart*85+arrival*42), y=WORLD.floor-19;
    const working=game.bots.filter(b=>b.target===task.id&&b.work);
    const nearbyBot=game.bots.find(b=>b.target===task.id);
    const worried=!done&&(!task.progress||nearbyBot?.locked);
    const talking=task.attention>0||done&&age<2.1;
    const lean=working.length?-3:0,bob=walking?Math.abs(Math.sin(walkPhase))*2:Math.sin(t*2.1+client.seed)*.7;
    c.save();c.globalAlpha=clamp(1-Math.max(depart,arrival*.75),0,1);
    this.shadow(x,y,21);
    c.translate(x,y-bob);c.lineCap='round';c.lineJoin='round';
    const limb=(points,width,color)=>{c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.strokeStyle='#252833';c.lineWidth=width+2;c.stroke();c.strokeStyle=color;c.lineWidth=width;c.stroke();};
    for(const side of[-1,1]){
      const stride=walking?Math.sin(walkPhase+(side<0?0:Math.PI))*11:0;
      limb([[side*7,-39],[side*8+stride*.45,-20],[side*8+stride,-2]],9,'#465162');
      limb([[side*8+stride,-2],[side*8+stride+5,0]],6,'#b4b4ac');
    }
    c.fillStyle=client.shirt;c.strokeStyle='#252833';c.lineWidth=2;
    c.beginPath();c.moveTo(-12+lean,-73);c.quadraticCurveTo(-22+lean,-64,-16,-34);c.quadraticCurveTo(0,-28,16,-34);c.quadraticCurveTo(22+lean,-64,12+lean,-73);c.closePath();c.fill();c.stroke();
    c.strokeStyle='#ffffff24';c.lineWidth=1;c.beginPath();c.moveTo(-6,-67);c.quadraticCurveTo(-10,-45,-7,-35);c.stroke();
    let left=[-18,-40],right=[21,-43];
    if(walking){left=[-19+Math.sin(walkPhase)*9,-42];right=[20-Math.sin(walkPhase)*9,-43];}
    else if(done&&age<1.3)right=[28,-99+Math.sin(t*6)*3];
    else if(done&&age<3.2){const clap=Math.abs(Math.sin(t*10))*9;left=[-clap,-66];right=[clap,-66];}
    else if(task.attention>0)left=[-36,-69+Math.sin(t*7)*2];
    else if(worried&&Math.sin(t*.8+client.seed)>.45)left=[-9,-91];
    else if(working.length)left=[-27,-55];
    for(const [side,hand] of [[-1,left],[1,right]]){
      limb([[side*15+lean,-67],[side*23,-52],hand],7,client.shirt);
      c.fillStyle=client.skin;c.strokeStyle='#30272a';c.lineWidth=1;c.beginPath();c.ellipse(hand[0],hand[1],4,5,side*.3,0,Math.PI*2);c.fill();c.stroke();
      if(done&&age<1.3&&side===1)limb([[hand[0]+2,hand[1]-1],[hand[0]+3,hand[1]-7]],2,client.skin);
    }
    limb([[lean,-82],[lean,-70]],10,client.skin);
    c.restore();
    c.save();c.globalAlpha=clamp(1-Math.max(depart,arrival*.75),0,1);
    const look=task.attention?clamp((game.player.x-x)/140,-1,1):nearbyBot?clamp((nearbyBot.x-x)/150,-1,1):-.15;
    this.portraits.draw(client,x+lean,y-101-bob,23,{look,mood:done?'happy':worried?'worried':task.progress>.73?'surprised':'neutral',talking,
      pitch:done&&age<1.2?Math.sin(age*12)*.13:.03,roll:done?.05:Math.sin(t*.7+client.seed)*.035,down:working.length>0},t,dt);
    c.restore();
    if(depart<.2&&!arrival){
      const reaction=done?task.result.reaction:task.attention?task.job.prompt:task.progress>.73?'Let’s see if it works…':task.progress>.23?'Oh, I see what you changed.':task.job.kind==='code'?'Why is my total a string?':task.job.kind==='math'?'I’m stuck on this one.':'Does this sound too blunt?';
      if(!this.compact)this.bubble(reaction,task.x+10,235,done?'#8bdf9c':'#aeb9c8',270,12);
      else if(done)this.bubble(task.job.kind==='math'?`x = ${task.result.value}! I get it.`:task.job.kind==='code'?`It returns ${task.result.value}!`:'That sounds like me!',task.x,238,'#8bdf9c',258,19);
    }
  }
  portrait(task,t,dt) {
    if(!this.closeup)return;
    const {ctx:c,portraits}=this.closeup, client=task.client;
    const happy=task.done>0, talking=task.attention>0||happy&&task.done>2.7;
    c.clearRect(0,0,192,192);
    c.fillStyle=client.shirt;c.beginPath();c.moveTo(31,192);c.quadraticCurveTo(34,148,78,142);c.lineTo(114,142);c.quadraticCurveTo(157,148,161,192);c.fill();
    c.fillStyle=client.skin;c.fillRect(84,128,24,27);
    portraits.draw(client,96,81,55,{look:-.12+Math.sin(t*.7)*.06,mood:happy?'happy':task.progress>.73?'surprised':task.progress>.23?'neutral':'worried',talking,pitch:happy?Math.sin(t*5)*.06:0,roll:Math.sin(t*.8+client.seed)*.025,down:false},t,dt);
  }
  render(game,now=0) {
    this.compact=this.canvas.clientWidth<500;
    const dt=this.lastNow?Math.min((now-this.lastNow)/1000,.05):0;this.lastNow=now;
    const animate=game.mode!=='paused'&&!(this.reduced&&game.mode==='ready');if(animate)this.time+=dt;
    const t=this.time,c=this.ctx;
    this.portrait(game.tasks[game.selected],t,animate?dt:0);
    c.clearRect(0,0,WORLD.width,WORLD.height);this.rect(0,0,960,540,'#0d1117');
    this.rect(0,WORLD.floor+1,960,94,'#11171e');this.rect(0,WORLD.floor,960,1,'#30363d');
    for(let x=24;x<960;x+=32)this.rect(x,WORLD.floor+19,2,2,'#29313d');
    if(game.mode==='ready'){
      this.text('CLAUDE  ×  CODEX',480,78,this.compact?38:31,'#e6edf3');
      this.text('Real requests. Two eager bots. One jailbreak.',480,113,this.compact?20:15,'#8b949e');
      this.bot({...game.bots[0],x:310,y:350,facing:1},t,1.55,false);
      this.avatar({...game.player,x:485,y:350,ground:350},'idle',Math.floor(t*3)%8,145);
      this.bot({...game.bots[1],x:658,y:350,facing:1},t,1.55,false);
      this.text('CLAUDE',310,383,15,'#e99b82');this.text('CHETAS / YOU',485,383,15,'#c4a7ff');this.text('CODEX',658,383,15,'#93b1ff');
      this.text('Choose a person. Watch the fix. Get a real reaction.',480,502,this.compact?20:14,'#8b949e');return;
    }
    this.text('HELP DESK',20,32,this.compact?19:12,'#8797a9','left');
    this.text(`CLAUDE ${game.bots[0].score}    CODEX ${game.bots[1].score}`,940,32,this.compact?19:12,'#9aaabd','right');
    for(const task of game.tasks)this.taskCard(task,game,t);
    for(const task of game.tasks)this.human(task,game,t,animate?dt:0);
    for(const pulse of game.pulses){c.save();c.globalAlpha=1-pulse.age/.65;c.strokeStyle='#bc8cff';c.lineWidth=3;c.beginPath();c.ellipse(pulse.x,pulse.y,Math.min(WORLD.pulseRadius,pulse.age*550),Math.min(110,pulse.age*240),0,0,Math.PI*2);c.stroke();c.restore();}
    for(const bot of game.bots)this.bot(bot,t,this.compact?1.15:1);
    const p=game.player;let name='idle',frame=Math.floor(t*3)%8;
    if(game.mode==='over'||p.celebrate>0){name='actions';frame=12+Math.floor(t*5)%4;}
    else if(p.cast>0){name='actions';frame=4+clamp(Math.floor((.6-p.cast)/.15),0,3);}
    else if(p.y<WORLD.floor){name='actions';frame=p.vy<-160?1:2;}
    else if(p.land>0){name='actions';frame=p.land>.09?3:0;}
    else if(Math.abs(p.vx)>8){name=Math.abs(p.vx)>220?'run':'walk';frame=Math.floor(p.walk)%8;}
    else if(p.help>.65){name='actions';frame=p.help<1?8:9+Math.floor(t*7)%2;}
    this.avatar(p,name,frame,this.compact?133:114);this.text('YOU',p.x,p.y+25,this.compact?20:11,'#c4a7ff');
    for(const v of game.particles){c.globalAlpha=clamp(v.life*2,0,1);this.rect(v.x,v.y,3,3,v.color);}c.globalAlpha=1;
    for(const v of game.floaters){c.globalAlpha=clamp(v.life*2,0,1);this.text(v.text,clamp(v.x,130,830),v.y,this.compact?21:12,v.color);}c.globalAlpha=1;
    const speakers=game.bots.filter(b=>b.speechTime>0);
    if(speakers.length){
      for(const bot of speakers){const x=bot.id==='claude'?240:720;this.round(x-219,491,438,36,5,'#151d28','#2b3544');this.text(`${bot.name}: ${bot.speech}`,x,514,this.compact?18:12,colorFor(bot.id));}
    }else this.text(this.compact?'Pick a person below. Send a bot. J = co-op.':game.messageTime>0?game.message:'Click a request to inspect it. E talks to someone nearby. J unlocks the bots.',480,516,this.compact?20:12,'#8b949e');
  }
}
function colorFor(id){return id==='claude'?'#e99b82':'#93b1ff';}
