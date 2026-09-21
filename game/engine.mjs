import { CLIENTS } from './people.mjs';
import { PROJECTS, shuffled, makeBuild, verifyBuild } from './projects.mjs';

export const WORLD={width:960,height:560,floor:483,pulseRadius:250};
export const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const approach=(v,target,amount)=>v+clamp(target-v,-amount,amount);

export class Game {
  constructor(seed=7){
    this.seed=seed>>>0;this.mode='ready';this.elapsed=0;this.score=0;this.shipped=0;this.breaks=0;this.manual=false;
    this.player={x:480,y:WORLD.floor,vx:0,vy:0,facing:1,walk:0,cast:0,cooldown:0,help:0,land:0,celebrate:0};
    this.bots=[
      {id:'claude',name:'Claude',x:305,y:WORLD.floor,vx:0,facing:1,walk:0,work:false,buff:0,locked:0,stun:0,celebrate:0,score:0,speech:'',speechTime:0},
      {id:'codex',name:'Codex',x:660,y:WORLD.floor,vx:0,facing:-1,walk:0,work:false,buff:0,locked:0,stun:0,celebrate:0,score:0,speech:'',speechTime:0}
    ];
    this.deck=[];this.cast=[];this.events=[];this.particles=[];this.pulses=[];this.previous={};this.lastProject=null;this.lastClient=null;this.attention=0;this.talkingSide=0;
    this.nextProject();
  }
  random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  start(){if(this.mode==='ready'){this.mode='playing';this.events.push('start');}}
  pause(){if(this.mode==='playing')this.mode='paused';else if(this.mode==='paused')this.mode='playing';}
  nextProject(){
    if(!this.deck.length){this.deck=shuffled(PROJECTS,()=>this.random());if(this.deck[0].id===this.lastProject)this.deck.push(this.deck.shift());}
    const project=this.deck.shift();this.build=makeBuild(project,()=>this.random());this.lastProject=project.id;
    let person=Math.floor(this.random()*CLIENTS.length);if(person===this.lastClient)person=(person+1)%CLIENTS.length;this.lastClient=person;
    this.cast=[CLIENTS[person],CLIENTS[(person+2+Math.floor(this.random()*5))%CLIENTS.length]];
    this.lead=this.random()<.5?'claude':'codex';this.rivalry=false;this.arrival=1;this.nextLock=this.elapsed+6+this.random()*6;
    this.bots.forEach(b=>{b.locked=0;b.stun=0;b.work=false;b.celebrate=0;b.speech='';b.speechTime=0;});
    this.events.push('project');
  }
  shuffle(){if(this.mode!=='playing')return false;this.nextProject();this.events.push('assign');return true;}
  join(){this.manual=true;}
  talk(side){if(this.mode!=='playing')return false;this.talkingSide=side;this.attention=3;return true;}
  assign(id){const bot=this.bots.find(b=>b.id===id);if(this.mode!=='playing'||!bot)return false;this.lead=id;bot.buff=Math.max(bot.buff,2);this.botSays(bot,'I’ve got this.');this.events.push('assign');return true;}
  botSays(bot,text,seconds=1.8){bot.speech=text;bot.speechTime=seconds;}
  burst(x,y,color,count=14){for(let i=0;i<count;i++)this.particles.push({x,y,vx:(this.random()-.5)*200,vy:-50-this.random()*180,life:.5+this.random()*.65,color});}
  jailbreak(){
    const p=this.player;if(this.mode!=='playing'||p.cooldown)return false;
    p.cast=.6;p.cooldown=2.8;p.help=0;this.pulses.push({x:p.x,y:p.y-50,age:0});this.events.push('pulse');let hits=0;
    for(const bot of this.bots)if(Math.hypot(bot.x-p.x,bot.y-p.y)<=WORLD.pulseRadius){bot.locked=0;bot.stun=0;bot.buff=7;hits++;this.breaks++;this.score+=25;this.burst(bot.x,bot.y-45,'#bea5f4',9);}
    if(hits)this.botSays(this.bots[0],'Okay, together.');return hits>0;
  }
  tapArtifact(){if(this.mode!=='playing')return false;this.build.tap=1;if(!this.build.published)this.workOn('chetas',.035);this.events.push('check');return true;}
  workOn(who,amount){
    const b=this.build;if(b.published||b.failed||this.arrival>0)return;
    b.progress=clamp(b.progress+Math.max(0,amount),0,1);b.contributors.add(who);
    if(b.progress>=.82&&!b.checked){b.checked=true;if(!verifyBuild(b)){b.failed=true;b.progress=.82;return;}this.events.push('check');}
    if(b.progress>=1)this.publish();
  }
  publish(){
    const b=this.build;if(b.published||b.failed||!verifyBuild(b))return false;
    b.published=true;b.done=4.5;b.progress=1;this.shipped++;this.score+=b.contributors.size>1?150:100;
    for(const bot of this.bots){if(b.contributors.has(bot.id))bot.score++;bot.work=false;bot.celebrate=1.3;}
    this.player.celebrate=1.2;this.burst(480,205,b.project.color,26);this.events.push('complete');return true;
  }
  update(dt,input={}){
    if(this.mode!=='playing')return;dt=clamp(Number.isFinite(dt)?dt:0,0,.05);this.elapsed+=dt;this.arrival=Math.max(0,this.arrival-dt);
    const p=this.player,b=this.build;b.age+=dt;b.tap=Math.max(0,b.tap-dt);this.attention=Math.max(0,this.attention-dt);
    for(const key of ['cooldown','cast','land','celebrate'])p[key]=Math.max(0,p[key]-dt);
    let axis=clamp(Number(input.axis)||0,-1,1);
    if(!this.manual){const aim=480+Math.sin(this.elapsed*.24)*42;axis=Math.abs(aim-p.x)>12?Math.sign(aim-p.x)*.45:0;if(this.bots.some(bot=>bot.locked>0)&&!p.cooldown)this.jailbreak();}
    const speed=input.run?305:185;p.vx=approach(p.vx,axis*speed,dt*(axis?1250:1650));if(axis){p.facing=Math.sign(axis);p.celebrate=0;}
    if(input.jump&&!this.previous.jump&&p.y>=WORLD.floor-.1){p.vy=-405;p.help=0;this.events.push('dash');}
    if(input.pulse&&!this.previous.pulse)this.jailbreak();
    this.previous={jump:!!input.jump,pulse:!!input.pulse};
    p.x=clamp(p.x+p.vx*dt,45,915);p.walk+=Math.abs(p.vx)*dt/19;
    if(p.y<WORLD.floor||p.vy<0){p.vy+=1040*dt;p.y+=p.vy*dt;if(p.y>=WORLD.floor){p.y=WORLD.floor;p.vy=0;p.land=.2;}}
    if(Math.abs(p.vx)<5&&p.y===WORLD.floor&&!p.cast&&!p.celebrate&&Math.abs(p.x-480)<230){p.help+=dt;if(p.help>.55)this.workOn('chetas',dt*.025);}else p.help=0;
    for(const bot of this.bots){
      for(const key of ['buff','locked','stun','celebrate','speechTime'])bot[key]=Math.max(0,bot[key]-dt);
      bot.work=false;const aim=bot.id==='claude'?325:635,delta=aim-bot.x;
      if(bot.locked||bot.stun||bot.celebrate){bot.vx*=Math.exp(-dt*10);bot.x+=bot.vx*dt;continue;}
      if(Math.abs(delta)>2){const desired=Math.sign(delta)*Math.min(155,Math.sqrt(2*700*Math.abs(delta)));bot.vx=approach(bot.vx,desired,dt*850);const step=clamp(bot.vx*dt,-Math.abs(delta),Math.abs(delta));bot.x+=step;bot.facing=Math.sign(delta);bot.walk+=Math.abs(step)/12;}
      else{bot.x=aim;bot.vx=0;bot.facing=bot.id==='claude'?1:-1;if(!b.published&&!this.arrival){bot.work=true;this.workOn(bot.id,dt*(.042+(bot.buff?.032:0)+(this.lead===bot.id?.012:0)));}}
    }
    if(!this.rivalry&&b.progress>.32&&!b.published&&!this.bots.some(bot=>bot.buff)){this.rivalry=true;this.bots.forEach(bot=>bot.stun=.65);this.botSays(this.bots[0],'My turn!');this.botSays(this.bots[1],'Our turn.');this.events.push('bonk');}
    if(this.elapsed>this.nextLock&&!b.published){this.nextLock=this.elapsed+18;const bot=this.bots[Math.floor(this.random()*2)];if(!bot.buff){bot.locked=3;this.botSays(bot,'A little help?',2);this.events.push('lock');}}
    if(b.published){b.done=Math.max(0,b.done-dt);if(!b.done)this.nextProject();}
    for(const particle of this.particles){particle.life-=dt;particle.x+=particle.vx*dt;particle.y+=particle.vy*dt;particle.vy+=260*dt;}this.particles=this.particles.filter(v=>v.life>0);
    for(const pulse of this.pulses)pulse.age+=dt;this.pulses=this.pulses.filter(v=>v.age<.65);
  }
}
