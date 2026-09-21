import test from 'node:test';
import assert from 'node:assert/strict';
import { statSync,readFileSync } from 'node:fs';
import { Game,WORLD } from './engine.mjs';
import { PROJECTS,makeBuild,verifyBuild } from './projects.mjs';
import { AVATAR } from './atlas.mjs';
const advance=(game,seconds,input={})=>{for(let i=0;i<Math.ceil(seconds*60);i++)game.update(1/60,input);};
const playing=(manual=true)=>{const game=new Game(123);game.start();if(manual)game.join();return game;};

test('the showcase uses six distinct real repositories and avoids adjacent repeats',()=>{
  const g=playing(),first=[];for(let i=0;i<6;i++){first.push(g.build.project.id);g.shuffle();}assert.equal(new Set(first).size,6);
  let previous=g.build.project.id;for(let i=0;i<60;i++){g.shuffle();assert.notEqual(g.build.project.id,previous);previous=g.build.project.id;}
  assert.ok(PROJECTS.every(p=>p.url===`https://github.com/ChetasLua/${p.repo}`));
});
test('equal seeds replay the same projects and build data',()=>{
  const a=new Game(22),b=new Game(22);assert.equal(a.build.project.id,b.build.project.id);assert.deepEqual(a.build.data,b.build.data);assert.deepEqual(a.cast,b.cast);
  const variants=new Set(Array.from({length:20},(_,i)=>new Game(i).build.project.id));assert.ok(variants.size>=4);
});
test('every project fixture passes meaningful checks for many randomized builds',()=>{
  const g=playing();for(const p of PROJECTS)for(let i=0;i<25;i++)assert.equal(verifyBuild(makeBuild(p,()=>g.random())),true,p.id);
});
test('a broken Sudoku, controller, edit, diff, control, or world cannot pass',()=>{
  const g=playing();const make=id=>makeBuild(PROJECTS.find(p=>p.id===id),()=>g.random());
  let b=make('sudoku');b.data.solution[0]=b.data.solution[1];assert.equal(verifyBuild(b),false);
  b=make('controller');b.data.sequence[0]=b.data.sequence[1];assert.equal(verifyBuild(b),false);
  b=make('video');b.data.cuts=[0,0,0];assert.equal(verifyBuild(b),false);
  b=make('diff');b.data.removed=['invented'];assert.equal(verifyBuild(b),false);
  b=make('controls');b.data.observed[0]=false;assert.equal(verifyBuild(b),false);
  b=make('world');b.data.homes[1]=b.data.homes[0];assert.equal(verifyBuild(b),false);
});
test('failed checks prevent publishing, scoring, and celebration',()=>{
  const g=playing();g.arrival=0;g.build=makeBuild(PROJECTS[0],()=>g.random());g.build.data.solution[0]=99;g.workOn('claude',1);
  assert.equal(g.build.failed,true);assert.equal(g.build.published,false);assert.equal(g.shipped,0);assert.equal(g.score,0);assert.equal(g.events.includes('complete'),false);
});
test('cooperation earns credit once and a finished build yields the next project',()=>{
  const g=playing();g.arrival=0;g.workOn('claude',.5);g.workOn('codex',.5);const id=g.build.project.id;
  assert.equal(g.shipped,1);assert.equal(g.score,150);assert.equal(g.bots[0].score,1);assert.equal(g.bots[1].score,1);assert.ok(g.bots.every(b=>b.celebrate>0));
  assert.equal(g.publish(),false);assert.equal(g.shipped,1);advance(g,4.6);assert.notEqual(g.build.project.id,id);assert.equal(g.shipped,1);
});
test('the ambient scene keeps building without a start gate or a sixty-second dead end',()=>{
  const g=playing(false);advance(g,120);assert.equal(g.mode,'playing');assert.ok(g.shipped>=5);assert.ok(g.bots.every(b=>b.score>0));assert.ok(g.breaks>0);
});
test('pausing freezes all simulation and blocks actions',()=>{
  const g=playing();advance(g,1);g.pause();const before=JSON.stringify(g);advance(g,5,{axis:1,pulse:true});assert.equal(JSON.stringify(g),before);
  assert.equal(g.shuffle(),false);assert.equal(g.jailbreak(),false);assert.equal(g.assign('codex'),false);assert.equal(g.tapArtifact(),false);assert.equal(g.talk(0),false);
  g.pause();advance(g,1);assert.ok(g.elapsed>1.9);
});
test('manual walking accelerates, running is faster, and stage boundaries contain Chetas',()=>{
  const a=playing(),b=playing();advance(a,1,{axis:1});advance(b,1,{axis:1,run:true});assert.ok(b.player.x>a.player.x+80);
  advance(b,5,{axis:1,run:true});assert.equal(b.player.x,915);advance(b,10,{axis:-1,run:true});assert.equal(b.player.x,45);
});
test('jumping lands and holding jump does not repeat',()=>{
  const g=playing();advance(g,.2,{jump:true});assert.ok(g.player.y<WORLD.floor-30);advance(g,1,{jump:true});assert.equal(g.player.y,WORLD.floor);assert.equal(g.player.vy,0);g.update(.02,{});g.update(.02,{jump:true});assert.ok(g.player.vy<0);
});
test('J clears nearby locks, buffs both bots, and respects its cooldown',()=>{
  const g=playing();g.bots[0].locked=3;assert.equal(g.jailbreak(),true);assert.equal(g.breaks,2);assert.equal(g.score,50);assert.ok(g.bots.every(b=>b.buff===7&&b.locked===0));assert.equal(g.jailbreak(),false);
  advance(g,2.9);g.player.x=45;g.bots.forEach(b=>b.x=800);assert.equal(g.jailbreak(),false);assert.equal(g.breaks,2);
});
test('held J pulses once until released',()=>{const g=playing();advance(g,8,{pulse:true});assert.equal(g.breaks,2);});
test('clicking an artifact, bot, or person has an observable effect',()=>{
  const g=playing();g.arrival=0;assert.equal(g.tapArtifact(),true);assert.ok(g.build.progress>0);assert.ok(g.build.tap>0);assert.ok(g.build.contributors.has('chetas'));
  assert.equal(g.assign('codex'),true);assert.equal(g.lead,'codex');assert.ok(g.bots[1].buff>0);assert.equal(g.assign('missing'),false);
  assert.equal(g.talk(1),true);assert.equal(g.talkingSide,1);assert.equal(g.attention,3);
});
test('suspended frames and invalid input do not corrupt positions',()=>{const g=playing();g.update(10,{axis:NaN});assert.equal(g.elapsed,.05);g.update(NaN);assert.ok(Number.isFinite(g.player.x));});
test('all forty image-generated frames remain available in the optimized atlas',()=>{
  assert.deepEqual(Object.values(AVATAR.groups).map(g=>g.length),[8,8,8,16]);assert.equal(AVATAR.frames.length,40);assert.equal(new Set(Object.values(AVATAR.groups).flat()).size,40);
  assert.ok(AVATAR.frames.every(f=>f.w>0&&f.h>0&&f.anchor>=0&&f.anchor<f.w));
  const before=['idle','walk','run','actions'].reduce((n,s)=>n+statSync(new URL(`../assets/chetas-${s}.png`,import.meta.url)).size,0);
  const after=statSync(new URL('../assets/chetas-atlas.webp',import.meta.url)).size;assert.ok(after<before*.07);
  const renderer=readFileSync(new URL('./renderer.mjs',import.meta.url),'utf8');assert.equal(renderer.includes('getImageData'),false);assert.equal(renderer.includes('putImageData'),false);
});
