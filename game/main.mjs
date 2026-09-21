import { Game, WORLD } from './engine.mjs';
import { Renderer } from './renderer.mjs';
import { Sound } from './audio.mjs';
const byId=id=>document.getElementById(id),canvas=byId('canvas'),panel=byId('game');
const game=new Game(Date.now()),renderer=new Renderer(canvas),sound=new Sound();
const controls={left:false,right:false,jump:false,pulse:false,run:false},pressed=new Set(),touch=new Map();
let targetX=null,last=0,lastUI=0,lastPaint=0,inView=true,autoPaused=false,lastProject='',lastShipped=-1;
const setText=(id,text)=>{const el=byId(id);if(el.textContent!==String(text))el.textContent=text;};
const clearInput=()=>{for(const k in controls)controls[k]=false;pressed.clear();touch.clear();targetX=null;document.querySelectorAll('[data-hold]').forEach(b=>b.classList.remove('active'));};
function join(){game.join();setText('join','Watch');byId('join').setAttribute('aria-pressed','true');canvas.focus({preventScroll:true});}
function pause(){game.pause();clearInput();autoPaused=false;sound.quiet(game.mode==='paused');updateUI();}
function updateUI(){
  setText('shipped',`${game.shipped} built`);setText('pause',game.mode==='paused'?'Resume':'Pause');byId('pause').setAttribute('aria-label',game.mode==='paused'?'Resume the scene':'Pause the scene');
  byId('overlay').hidden=game.mode!=='paused';byId('shuffle').disabled=game.mode!=='playing';byId('pulse').disabled=game.mode!=='playing'||game.player.cooldown>0;
  setText('charge',game.player.cooldown>0?game.player.cooldown.toFixed(1):'');
  const project=game.build.project;
  if(lastProject!==project.id){lastProject=project.id;setText('project-name',project.repo);byId('project-link').href=project.url;byId('project-link').title=project.title;setText('live',`${project.title}. Click a bot to lead, a person to talk, or the project to try it.`);}
  if(lastShipped!==game.shipped){lastShipped=game.shipped;if(game.shipped)setText('live',`${project.title} completed. ${game.shipped} projects built. Source: ${project.repo}.`);}
}
byId('join').addEventListener('click',()=>{clearInput();if(game.manual){game.manual=false;setText('join','Join in');byId('join').setAttribute('aria-pressed','false');}else join();});
byId('pause').addEventListener('click',pause);byId('resume').addEventListener('click',()=>{pause();canvas.focus({preventScroll:true});});
byId('shuffle').addEventListener('click',()=>{game.shuffle();updateUI();});
byId('pulse').addEventListener('click',()=>{join();game.jailbreak();});
byId('sound').addEventListener('click',async()=>{try{const on=await sound.toggle();byId('sound').setAttribute('aria-pressed',String(on));byId('sound').setAttribute('aria-label',on?'Mute sound':'Enable sound');setText('sound',on?'Mute':'Sound');sound.quiet(game.mode==='paused');}catch{setText('live','Sound is unavailable. The scene still works.');}});
const keys={e:'talk',E:'talk',j:'pulse',J:'pulse',a:'left',A:'left',d:'right',D:'right',ArrowLeft:'left',ArrowRight:'right',' ':'jump',ArrowUp:'jump',w:'jump',W:'jump',Shift:'run'};
window.addEventListener('keydown',e=>{
  if(!panel.contains(document.activeElement))return;
  if(e.key==='Escape'&&!e.repeat){e.preventDefault();pause();return;}
  const key=keys[e.key];if(!key||game.mode!=='playing')return;e.preventDefault();if(!game.manual)join();
  if(key==='talk'){game.talk(game.player.x<480?0:1);return;}
  controls[key]=true;if(!e.repeat)pressed.add(key);targetX=null;
});
window.addEventListener('keyup',e=>{const key=keys[e.key];if(key in controls)controls[key]=false;});
for(const button of document.querySelectorAll('[data-hold]')){
  button.addEventListener('pointerdown',e=>{e.preventDefault();if(game.mode!=='playing')return;join();button.setPointerCapture(e.pointerId);touch.set(e.pointerId,button.dataset.hold);pressed.add(button.dataset.hold);button.classList.add('active');targetX=null;});
  const release=e=>{touch.delete(e.pointerId);button.classList.remove('active');};button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
}
function position(e){const box=canvas.getBoundingClientRect();return {x:(e.clientX-box.left)/box.width*renderer.view.w,y:(e.clientY-box.top)/box.height*renderer.view.h};}
canvas.addEventListener('pointermove',e=>{if(renderer.view)renderer.lookAt=position(e);});canvas.addEventListener('pointerleave',()=>renderer.lookAt=null);
canvas.addEventListener('pointerdown',e=>{
  if(game.mode!=='playing'||!renderer.view)return;canvas.focus({preventScroll:true});const {x,y}=position(e),worldX=x/renderer.view.w*WORLD.width;
  if(renderer.hit(x,y)){game.tapArtifact();return;}
  const bot=game.bots.find(b=>Math.abs(b.x-worldX)<62&&y>renderer.view.floor-130&&y<renderer.view.floor+20);
  if(bot){game.assign(bot.id);return;}
  if(y>renderer.view.floor-245&&(worldX<200||worldX>750)){game.talk(worldX<480?0:1);return;}
  join();targetX=worldX;
});
function suspend(){clearInput();if(game.mode==='playing'){game.pause();autoPaused=true;sound.quiet(true);updateUI();}}
function resumeVisible(){if(autoPaused&&!document.hidden&&inView){game.pause();autoPaused=false;last=0;sound.quiet(false);updateUI();}}
document.addEventListener('visibilitychange',()=>document.hidden?suspend():resumeVisible());window.addEventListener('blur',suspend);window.addEventListener('focus',resumeVisible);
if('IntersectionObserver' in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(!inView)suspend();else resumeVisible();},{rootMargin:'100px'}).observe(canvas);
function frame(now){
  const dt=last?Math.min((now-last)/1000,.05):0;last=now;
  if(inView&&!document.hidden){
    const held=new Set([...touch.values(),...pressed]);let axis=Number(controls.right||held.has('right'))-Number(controls.left||held.has('left'));
    if(targetX!==null){const delta=targetX-game.player.x;if(Math.abs(delta)<9)targetX=null;else axis=Math.sign(delta);}
    game.update(dt,{axis,jump:controls.jump||held.has('jump'),pulse:controls.pulse||held.has('pulse'),run:controls.run||held.has('run')||touch.size>0&&(held.has('left')||held.has('right'))});
    pressed.clear();while(game.events.length)sound.cue(game.events.shift());sound.update(game);
    if(now-lastPaint>=(renderer.compact?1000/30:1000/60)){renderer.render(game,now);lastPaint=now;}
    if(now-lastUI>100){updateUI();lastUI=now;}
  }
  requestAnimationFrame(frame);
}
game.start();renderer.render(game,0);updateUI();requestAnimationFrame(frame);
renderer.load().catch(()=>setText('live','The avatar could not load. The code-drawn characters and projects are still running.'));
