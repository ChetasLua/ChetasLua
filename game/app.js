(() => {
'use strict';
const CLIENTS = [
  { name: 'Sam', seed: 41, skin: '#d7b398', shirt: '#527d8c', hair: 'hatch', glasses: 'round', beard: 'stubble' },
  { name: 'Nia', seed: 92, skin: '#b78670', shirt: '#9b789f', hair: 'curly', earring: true },
  { name: 'Jules', seed: 153, skin: '#e4c6b1', shirt: '#73836a', hair: 'bob', bun: true },
  { name: 'Ravi', seed: 244, skin: '#be9277', shirt: '#698379', hair: 'black', glasses: 'square' },
  { name: 'Ada', seed: 315, skin: '#ebccb6', shirt: '#b48763', hair: 'hatch', freckles: true },
  { name: 'Milo', seed: 426, skin: '#d4a27f', shirt: '#6682a3', hair: 'beanie', beard: 'goatee' },
  { name: 'Leah', seed: 527, skin: '#a87660', shirt: '#ab7c7c', hair: 'bob', glasses: 'round' },
  { name: 'Theo', seed: 638, skin: '#e3c3aa', shirt: '#748da1', hair: 'black', wrinkles: true },
  { name: 'Ira', seed: 749, skin: '#d0aa8d', shirt: '#9a8770', hair: 'curly', glasses: 'square' }
];

// Public repository descriptions verified against ChetasLua's GitHub on 2026-09-21.
const PROJECTS = [
  {id:'sudoku',repo:'sudoku-graph-coloring',title:'Sudoku, in living color',tag:'math → art',color:'#9ac4f6',request:'Can you make the logic visible?',reaction:'Now I can see how it works.',kind:'sudoku'},
  {id:'controller',repo:'xbox360-svg-controller',title:'A controller made of SVG',tag:'code → play',color:'#a8d291',request:'Build something I can play with.',reaction:'Even the buttons feel alive.',kind:'controller'},
  {id:'video',repo:'jevmeter',title:'Find the moments. Make the cut.',tag:'video → edit',color:'#d6abed',request:'There’s a great edit in here.',reaction:'That’s the cut I was looking for.',kind:'video'},
  {id:'diff',repo:'scrubwatch',title:'The words that changed',tag:'history → evidence',color:'#e2b793',request:'Show me what changed.',reaction:'There it is. The whole change.',kind:'diff'},
  {id:'controls',repo:'negative-controls',title:'Test the test',tag:'claims → checks',color:'#83d1b8',request:'Can we trust this result?',reaction:'Now that’s a result I trust.',kind:'controls'},
  {id:'world',repo:'little-neighbourhood',title:'A little world, made of code',tag:'code → life',color:'#edc77d',request:'Make a tiny place feel alive.',reaction:'I could watch this all day.',kind:'world'}
].map(p=>({...p,url:`https://github.com/ChetasLua/${p.repo}`}));

function shuffled(items,random) {
  const list=[...items];
  for(let i=list.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
  return list;
}
function makeBuild(project,random) {
  const value={project,progress:0,age:0,done:0,published:false,checked:false,failed:false,contributors:new Set(),tap:0};
  if(project.kind==='sudoku'){
    const digits=shuffled([1,2,3,4,5,6,7,8,9],random);
    const solution=Array.from({length:81},(_,i)=>digits[(Math.floor(i/9)*3+Math.floor(Math.floor(i/9)/3)+i%9)%9]);
    const order=shuffled(Array.from({length:81},(_,i)=>i),random);
    value.data={solution,order,givens:new Set(order.slice(0,24))};
  }else if(project.kind==='controller'){
    value.data={buttons:['A','B','X','Y','LB','RB','LT','RT','START','BACK','LS','RS'],sequence:shuffled([0,1,2,3,4,5,6,7,8,9,10,11],random)};
  }else if(project.kind==='video'){
    const scores=Array.from({length:24},()=>.15+random()*.8);
    const cuts=scores.map((score,index)=>({score,index})).sort((a,b)=>b.score-a.score).slice(0,3).map(x=>x.index).sort((a,b)=>a-b);
    value.data={scores,cuts,wave:Array.from({length:96},()=>.12+random()*.88)};
  }else if(project.kind==='diff'){
    const before=['read the source','record the claim','check the date','keep the original','publish the evidence'];
    const after=['read the source','record the claim','verify the date','add a positive control','keep the original','publish the evidence'];
    value.data={before,after,removed:before.filter(x=>!after.includes(x)),added:after.filter(x=>!before.includes(x))};
  }else if(project.kind==='controls'){
    const fixtures=[{input:'known marker',expected:true},{input:'ordinary text',expected:false},{input:'marker again',expected:true},{input:'empty result',expected:false}];
    value.data={fixtures,observed:fixtures.map(f=>f.input.includes('marker'))};
  }else{
    value.data={homes:Array.from({length:6},(_,i)=>({x:i%3,y:Math.floor(i/3),hue:Math.floor(random()*5)})),paths:[[0,1],[1,2],[0,3],[3,4],[4,5],[2,5]]};
  }
  return value;
}
function verifyBuild(build){
  const d=build.data,kind=build.project.kind;
  if(kind==='sudoku'){
    const valid=values=>values.length===9&&new Set(values).size===9&&values.every(v=>Number.isInteger(v)&&v>=1&&v<=9);
    for(let n=0;n<9;n++){
      if(!valid(d.solution.slice(n*9,n*9+9)))return false;
      if(!valid(Array.from({length:9},(_,i)=>d.solution[i*9+n])))return false;
      if(!valid(Array.from({length:9},(_,i)=>d.solution[(Math.floor(n/3)*3+Math.floor(i/3))*9+(n%3)*3+i%3])))return false;
    }return true;
  }
  if(kind==='controller')return new Set(d.buttons).size===12&&new Set(d.sequence).size===12&&d.sequence.every(n=>Number.isInteger(n)&&n>=0&&n<12);
  if(kind==='video'){const threshold=[...d.scores].sort((a,b)=>b-a)[2];return d.cuts.length===3&&new Set(d.cuts).size===3&&d.cuts.every(n=>Number.isInteger(n)&&n>=0&&n<d.scores.length&&d.scores[n]>=threshold);}
  if(kind==='diff')return d.removed.length>0&&d.added.length>0&&d.removed.every(x=>d.before.includes(x)&&!d.after.includes(x))&&d.added.every(x=>d.after.includes(x)&&!d.before.includes(x));
  if(kind==='controls')return d.observed.length===d.fixtures.length&&d.fixtures.every((f,i)=>f.expected===d.observed[i])&&d.observed.some(Boolean)&&d.observed.some(x=>!x);
  if(kind==='world')return d.homes.length===6&&new Set(d.homes.map(h=>`${h.x},${h.y}`)).size===6&&d.paths.every(edge=>edge.every(i=>d.homes[i]));
  return false;
}

const AVATAR = {"baseHeight":208,"groups":{"idle":[0,1,2,3,4,5,6,7],"walk":[8,9,10,11,12,13,14,15],"run":[16,17,18,19,20,21,22,23],"actions":[24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39]},"frames":[{"x":4,"y":4,"w":114,"h":208,"anchor":55.54},{"x":228,"y":4,"w":117,"h":210,"anchor":54.89},{"x":452,"y":4,"w":116,"h":211,"anchor":53.57},{"x":676,"y":4,"w":115,"h":208,"anchor":52.93},{"x":900,"y":4,"w":114,"h":203,"anchor":53.81},{"x":1124,"y":4,"w":114,"h":203,"anchor":54.94},{"x":1348,"y":4,"w":115,"h":203,"anchor":54.97},{"x":1572,"y":4,"w":115,"h":203,"anchor":54.72},{"x":4,"y":238,"w":122,"h":210,"anchor":59.28},{"x":228,"y":238,"w":110,"h":209,"anchor":53.12},{"x":452,"y":238,"w":107,"h":210,"anchor":53.76},{"x":676,"y":238,"w":124,"h":208,"anchor":50.98},{"x":900,"y":238,"w":119,"h":205,"anchor":54.78},{"x":1124,"y":238,"w":115,"h":205,"anchor":51.97},{"x":1348,"y":238,"w":106,"h":205,"anchor":50.31},{"x":1572,"y":238,"w":119,"h":207,"anchor":50.27},{"x":4,"y":472,"w":174,"h":208,"anchor":112.81},{"x":228,"y":472,"w":144,"h":209,"anchor":90.62},{"x":452,"y":472,"w":169,"h":210,"anchor":110.52},{"x":676,"y":472,"w":190,"h":199,"anchor":127.25},{"x":900,"y":472,"w":177,"h":208,"anchor":117.94},{"x":1124,"y":472,"w":145,"h":208,"anchor":87.77},{"x":1348,"y":472,"w":162,"h":210,"anchor":103.74},{"x":1572,"y":472,"w":188,"h":198,"anchor":125.59},{"x":4,"y":706,"w":142,"h":187,"anchor":76.19},{"x":228,"y":706,"w":151,"h":213,"anchor":82.96},{"x":452,"y":706,"w":160,"h":200,"anchor":82.11},{"x":676,"y":706,"w":154,"h":192,"anchor":76.25},{"x":900,"y":706,"w":153,"h":203,"anchor":67.32},{"x":1124,"y":706,"w":190,"h":203,"anchor":82.78},{"x":1348,"y":706,"w":216,"h":203,"anchor":86.06},{"x":1572,"y":706,"w":199,"h":226,"anchor":119.85},{"x":4,"y":940,"w":144,"h":208,"anchor":52.65},{"x":228,"y":940,"w":153,"h":206,"anchor":60.71},{"x":452,"y":940,"w":154,"h":225,"anchor":63.68},{"x":676,"y":940,"w":123,"h":208,"anchor":53.2},{"x":900,"y":940,"w":136,"h":213,"anchor":60.39},{"x":1124,"y":940,"w":143,"h":214,"anchor":70.33},{"x":1348,"y":940,"w":139,"h":203,"anchor":65.92},{"x":1572,"y":940,"w":137,"h":213,"anchor":63.24}]};

// Adapted from Chetas's Head Cases drawing code (Claude Code, September 19, 2026).
// Features live on a shaped 3D skull; changing yaw, pitch and expression moves the geometry.
function createPortraits(ctx) {
const PI=Math.PI, TAU=PI*2;
const {sin,cos,abs,min,max,hypot,atan2,floor,sqrt,exp,pow,sign}=Math;
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,x)=>{x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x)};
const ease=t=>t<.5?2*t*t:1-pow(-2*t+2,2)/2;
function hash(n){n=Math.imul(n^n>>>16,0x45d9f3b);n=Math.imul(n^n>>>16,0x45d9f3b);return((n^n>>>16)>>>0)/4294967296}
function noise1(x,seed){const i=floor(x),f=x-i,u=f*f*(3-2*f),s=(seed*104729)|0;return lerp(hash(i*7919+s|0),hash((i+1)*7919+s|0),u)*2-1}
function RNG(seed){let s=seed>>>0;
  const r=()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  r.range=(a,b)=>a+(b-a)*r(); r.int=(a,b)=>floor(r.range(a,b+1)); r.pick=a=>a[floor(r()*a.length)]; r.chance=p=>r()<p;
  r.wpick=o=>{let t=0;for(const k in o)t+=o[k];let x=r()*t;for(const k in o){x-=o[k];if(x<=0)return k}return Object.keys(o)[0]};
  return r}


let PAPER='#e5cab2', INK='#241e20', ACCENT='#c86e65', FACE=null, SC=1, BOIL=0;
/* a pen stroke = filled ribbon: wobbles along its length, swells in the middle, tapers at the ends */
function ink(pts,w,seed,closed,amp){
  const n=pts.length;if(n<2)return;w*=SC;seed=(seed|0)+BOIL*31;
  const d=new Float32Array(n);let L=0;for(let i=1;i<n;i++){L+=hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);d[i]=L}
  if(L<.6){ctx.beginPath();ctx.arc(pts[0][0],pts[0][1],w*.55,0,TAU);ctx.fill();return}
  amp=(amp==null?.62:amp)*SC;const lx=[],ly=[],rx=[],ry=[];
  for(let i=0;i<n;i++){
    const a=pts[closed?(i-1+n)%n:max(i-1,0)],b=pts[closed?(i+1)%n:min(i+1,n-1)];
    let tx=b[0]-a[0],ty=b[1]-a[1];const tl=hypot(tx,ty)||1;tx/=tl;ty/=tl;
    const t=d[i]/L,s=d[i]*.05/SC,wob=noise1(s+seed*.37,seed)*amp;
    let ww=w*(.8+.32*noise1(s*1.9+4.2,seed+11));if(!closed)ww*=min(1,.28+min(t,1-t)*8);
    const px=pts[i][0]-ty*wob,py=pts[i][1]+tx*wob;
    lx.push(px-ty*ww*.5);ly.push(py+tx*ww*.5);rx.push(px+ty*ww*.5);ry.push(py-tx*ww*.5)}
  ctx.beginPath();ctx.moveTo(lx[0],ly[0]);for(let i=1;i<n;i++)ctx.lineTo(lx[i],ly[i]);
  if(closed){ctx.closePath();ctx.moveTo(rx[n-1],ry[n-1]);for(let i=n-2;i>=0;i--)ctx.lineTo(rx[i],ry[i]);ctx.closePath()}
  else{for(let i=n-1;i>=0;i--)ctx.lineTo(rx[i],ry[i]);ctx.closePath()}
  ctx.fill()}
function chaikin(p,closed,it){for(let k=0;k<(it||1);k++){const q=[],n=p.length;if(!closed)q.push(p[0]);
  for(let i=0;i<(closed?n:n-1);i++){const a=p[i],b=p[(i+1)%n];q.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75])}
  if(!closed)q.push(p[n-1]);p=q}return p}
function path(pts,close){ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);if(close)ctx.closePath()}
function fillPoly(pts,col){if(pts.length<3)return;path(pts,1);ctx.fillStyle=col;ctx.fill();ctx.fillStyle=INK}
function dot(x,y,r){ctx.beginPath();ctx.arc(x,y,r*SC,0,TAU);ctx.fill()}
function hull(P){P.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const n=P.length;if(n<3)return P;const Hh=[];
  const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
  for(let i=0;i<n;i++){while(Hh.length>=2&&cr(Hh[Hh.length-2],Hh[Hh.length-1],P[i])<=0)Hh.pop();Hh.push(P[i])}
  const t=Hh.length+1;for(let i=n-2;i>=0;i--){while(Hh.length>=t&&cr(Hh[Hh.length-2],Hh[Hh.length-1],P[i])<=0)Hh.pop();Hh.push(P[i])}
  Hh.pop();return Hh}

/* ───────────────────────── 3. DNA: one seed → one person ───────────────────────── */
function makeDNA(seed){const r=RNG(seed),d={seed};
  // skull
  d.rx=r.range(.8,1.02);d.ry=r.range(1.02,1.3);d.rz=r.range(.9,1.06);
  d.jaw=r.range(.04,.46);d.sq=r.range(0,.2);d.chin=r.range(-.03,.13);d.cheek=r.range(0,.1);d.back=r.range(0,.16);d.flat=r.range(0,.12);d.jd=0;
  // face map (radians on the skull: az 0 = nose, el 0 = equator)
  d.eyeX=r.range(.3,.45);d.eyeY=r.range(.03,.2);d.eyeW=r.range(.1,.16);d.eyeH=d.eyeW*r.range(.45,1);d.eyeTilt=r.range(-.25,.3);
  d.eyeStyle=r.wpick({almond:5,round:3,dot:1.2});d.pupil=r.range(.32,.55);d.iris=r.chance(.3);d.lidHeavy=r.chance(.45);d.lid=r.range(.66,1);
  d.browStyle=r.wpick({line:4,thick:3,none:1});d.browY=r.range(.1,.17);d.browTilt=r.range(-.12,.16);d.browArch=r.range(.01,.06);
  d.noseStyle=r.wpick({L:5,U:2.2,tri:1.6});d.noseLen=r.range(.2,.5);d.noseW=r.range(.1,.18);d.noseTip=r.range(-.34,-.18);d.noseDrop=r.range(-.04,.1);d.noseSide=r.chance(.5)?1:-1;
  d.mouthY=r.range(-.74,-.58);d.mouthW=r.range(.17,.3);d.mood=r.range(-.35,.5);d.lips=r.wpick({line:5,lower:3,full:2});
  d.earSize=r.range(.14,.27);d.earOut=r.range(.1,.24);d.earY=r.range(-.04,.1);
  // hair
  d.hair=r.wpick({black:8,hatch:5,curly:2.2,stubble:1.6,bald:1.2,bob:1.6,beanie:1.3,flatcap:1.3});
  d.hairFront=r.range(.62,1);d.hairSide=r.range(-.05,.3);d.hairBack=r.range(-.75,-.3);d.hairLift=r.range(.05,.2);d.quiff=r.chance(.45)?r.range(.08,.3):0;
  d.hairSwirl=r.range(-.9,.9);d.hairWig=r.range(.02,.09);d.band=(d.hair==='black'||d.hair==='hatch')&&r.chance(.16);d.bun=d.hair==='bob'&&r.chance(.5);
  // face furniture
  d.stache=r.wpick({none:9,chevron:2,handlebar:1.3,pencil:1.2,walrus:1});d.beard=r.wpick({none:9,goatee:1.6,stubble:1.8,full:1.2,soul:.8});
  d.glasses=r.wpick({none:10,round:1.6,square:1.6,shades:.8,patch:.5,monocle:.4});
  d.freckles=r.chance(.2);d.wrinkles=r.chance(.5);d.bags=r.chance(.3);d.folds=r.chance(.3);d.mole=r.chance(.12)?[r.range(-.6,.6),r.range(-.8,-.2)]:null;
  d.collar=r.wpick({none:2,crew:3,turtle:1.5,shirt:2});d.earring=r.chance(.1);
  // temperament
  d.speed=r.range(.6,1.5);d.headGain=r.range(.45,.85);d.nerve=r.range(0,1);d.phase=r.range(0,100);
  if(d.hair==='bob'){d.stache='none';d.beard='none';d.hairSide=-.9;d.hairBack=-1.1;d.hairLift=r.range(.12,.2)}
  if(d.hair==='curly')d.hairLift=r.range(.14,.24);
  if(d.hair==='beanie'||d.hair==='flatcap'){d.hairFront=r.range(.5,.7);d.hairSide=r.range(.2,.35);d.hairBack=r.range(-.25,0);d.hairLift=.09;d.quiff=0}
  return d}

/* ───────────────────────── 4. the rough 3D head ───────────────────────── */
// every feature lives at (azimuth, elevation) on this lumpy egg; turn the egg and the face follows
function surf(d,az,el,lift){
  const ce=cos(el),dx=sin(az)*ce,dy=-sin(el),dz=cos(az)*ce,dn=-el,q=1-d.sq,caz=cos(az),k=1+(lift||0);
  const f=1-d.jaw*sstep(0,1.35,dn)+d.cheek*exp(-(el+.45)*(el+.45)/.09)*abs(sin(az));
  return [sign(dx)*pow(abs(dx),q)*d.rx*f*k,
          (sign(dy)*pow(abs(dy),q)*d.ry*(1-d.flat*sstep(.6,1.5,el))+d.jd*sstep(.5,1.25,dn))*k,
          (dz*d.rz*f+d.chin*sstep(.5,1.3,dn)*max(0,caz)-d.back*max(0,-caz)*ce*sstep(-.3,.7,el))*k]}
function hairEl(d,az){const a=abs(az>PI?az-TAU:az);
  const e=a<1.35?lerp(d.hairFront,d.hairSide,sstep(.45,1.25,a)):lerp(d.hairSide,d.hairBack,sstep(1.5,2.6,a));
  return e+d.hairWig*noise1(az*3.1+d.seed%97,d.seed)*(a<2?1:.3)}
const NA=40,NE=20,HK=7;
function putVert(d,P,N,o,p){P[o]=p[0];P[o+1]=p[1];P[o+2]=p[2];
  const nx=p[0]/(d.rx*d.rx),ny=p[1]/(d.ry*d.ry),nz=p[2]/(d.rz*d.rz),l=hypot(nx,ny,nz)||1;N[o]=nx/l;N[o+1]=ny/l;N[o+2]=nz/l}
function buildSkin(h,jmax){const d=h.d;if(!h.sk){h.sk=new Float32Array((NE+1)*NA*3);h.skn=new Float32Array((NE+1)*NA*3)}
  for(let j=0;j<=jmax;j++){const el=-PI/2+PI*j/NE;for(let i=0;i<NA;i++)putVert(d,h.sk,h.skn,(j*NA+i)*3,surf(d,TAU*i/NA-PI,el,0))}
  h.jdBuilt=d.jd}
function buildHair(h){const d=h.d;if(d.hair==='bald'){h.hr=null;return}
  const n=NA*(HK+1);h.hr=new Float32Array(n*3);h.hrn=new Float32Array(n*3);h.hp=new Float32Array(n*2);
  for(let i=0;i<NA;i++){const az=TAU*i/NA-PI,e0=hairEl(d,az);
    for(let k=0;k<=HK;k++){const t=k/HK,el=lerp(e0,PI/2,t);
      const lift=d.hairLift*(.22+.78*sstep(0,.45,t))+d.quiff*exp(-az*az/.5)*exp(-pow((el-d.hairFront-.2)/.35,2));
      putVert(d,h.hr,h.hrn,(i*(HK+1)+k)*3,surf(d,az,el,lift))}}}
function setPose(h){const cy=cos(h.yaw),sy=sin(h.yaw),cp=cos(h.pitch),sp=sin(h.pitch),c=cos(h.roll),s=sin(h.roll);
  h.M=[cy*c-sy*sp*s,-cy*s-sy*sp*c,sy*cp, cp*s,cp*c,sp, -sy*c-cy*sp*s,sy*s-cy*sp*c,cy*cp]}
function xf(h,p){const m=h.M,v=h.pv,x=p[0]-v[0],y=p[1]-v[1],z=p[2]-v[2];
  const X=m[0]*x+m[1]*y+m[2]*z+v[0],Y=m[3]*x+m[4]*y+m[5]*z+v[1],Z=m[6]*x+m[7]*y+m[8]*z+v[2],f=h.S*(1+Z*.11);
  return [h.cx+X*f,h.cy+Y*f,Z,1]}
function projectSet(h,P,N,out,cand){const m=h.M,v=h.pv,S=h.S;
  for(let i=0,o=0;o<P.length;i++,o+=3){
    const x=P[o]-v[0],y=P[o+1]-v[1],z=P[o+2]-v[2],Z=m[6]*x+m[7]*y+m[8]*z+v[2],f=S*(1+Z*.11);
    const sx=h.cx+(m[0]*x+m[1]*y+m[2]*z+v[0])*f,sy=h.cy+(m[3]*x+m[4]*y+m[5]*z+v[1])*f;
    if(out){out[i*2]=sx;out[i*2+1]=sy}
    const nz=m[6]*N[o]+m[7]*N[o+1]+m[8]*N[o+2];if(nz<.34&&nz>-.3)cand.push([sx,sy])}}
function projectHead(h){
  if(abs(h.d.jd-h.jdBuilt)>.004)buildSkin(h,8);
  setPose(h);const cand=[];projectSet(h,h.sk,h.skn,null,cand);if(h.hr)projectSet(h,h.hr,h.hrn,h.hp,cand);
  h.out=chaikin(hull(cand),true,2)}
// a point on the skin → [screenX, screenY, depth, facing]   (facing > 0 means we can see it)
function proj(h,az,el,lift){const d=h.d,p=surf(d,az,el,lift),m=h.M;
  const nx=p[0]/(d.rx*d.rx),ny=p[1]/(d.ry*d.ry),nz=p[2]/(d.rz*d.rz),l=hypot(nx,ny,nz)||1,q=xf(h,p);
  q[3]=(m[6]*nx+m[7]*ny+m[8]*nz)/l;return q}
function runs(pts,thr){const out=[];let cur=null;thr=thr==null?.04:thr;
  for(const p of pts){if(p[3]>thr){if(!cur)out.push(cur=[]);cur.push(p)}else cur=null}return out}
function curve(h,fn,n,lift){const pts=[];for(let i=0;i<=n;i++){const a=fn(i/n);pts.push(proj(h,a[0],a[1],a[2]==null?lift:a[2]))}return pts}
function strokeOn(h,fn,n,w,seed,lift,thr){for(const r of runs(curve(h,fn,n,lift==null?.012:lift),thr))if(r.length>1)ink(r,w,seed)}
function loopOn(h,fn,n,lift){const pts=curve(h,fn,n,lift==null?.012:lift);pts.pop();return pts}
const facing=(pts,thr)=>{let s=0;for(const p of pts)s+=p[3];return s/pts.length>(thr==null?.1:thr)};

/* ───────────────────────── 5. features — each one is a function of the head ───────────────────────── */
const F={};
F.neck=h=>{const d=h.d,S=h.S,nw=S*d.rx*.42,y0=h.cy+S*d.ry*.45,y1=h.by+S*d.ry*1.18,sd=h.seed;
  const L=[],R=[];for(let i=0;i<=5;i++){const t=i/5,b=sin(t*PI)*S*.035;L.push([lerp(h.cx-nw*.9,h.bx-nw*1.12,t)+b,lerp(y0,y1,t)]);R.push([lerp(h.cx+nw*.9,h.bx+nw*1.12,t)-b,lerp(y0,y1,t)])}
  fillPoly(L.concat(R.slice().reverse()),PAPER);ink(L,1.5,sd+1);ink(R,1.5,sd+2);
  const lx=h.bx-nw*1.12,rx=h.bx+nw*1.12,arc=(dy,sag,w,s)=>{const p=[];for(let i=0;i<=8;i++){const t=i/8;p.push([lerp(lx,rx,t),y1+dy+sin(t*PI)*sag])}ink(p,w,s)};
  for(const s of[-1,1]){const p=[];for(let i=0;i<=5;i++){const t=i/5;p.push([h.bx+s*(nw*1.12+t*S*.55),y1+t*t*S*.2])}ink(p,1.5,sd+5+s)}
  if(d.collar==='crew')arc(0,S*.13,1.5,sd+7);
  else if(d.collar==='turtle'){arc(-S*.2,S*.05,1.4,sd+7);arc(-S*.1,S*.06,1.1,sd+8);arc(0,S*.07,1.4,sd+9)}
  else if(d.collar==='shirt')for(const s of[-1,1]){const x=s<0?lx:rx;ink([[x,y1-S*.06],[h.bx+s*S*.05,y1+S*.2],[x+s*S*.12,y1+S*.12],[x,y1-S*.06]],1.3,sd+10+s)}};

F.ear=(h,s,pass)=>{const d=h.d,azE=s*1.66,top=d.eyeY+d.earY+d.earSize*.75,bot=top-d.earSize*1.9;
  const c=proj(h,azE,(top+bot)/2,0),front=c[3]>.14&&d.hair!=='bob';
  if(front!==(pass===1)||(pass===0&&c[3]<-.8))return;
  const outer=[],root=[];
  for(let i=0;i<=8;i++){const t=i/8,p=surf(d,azE,lerp(top,bot,t),0),b=pow(sin(PI*t),.6)*(1-.35*t);
    outer.push(xf(h,[p[0]+s*d.earOut*b,p[1]-d.earSize*.12*(1-t)*b,p[2]-d.earOut*.55*b]));root.push(xf(h,p))}
  fillPoly(outer.concat(root.reverse()),PAPER);ink(outer,1.5,h.seed+40+s);
  const inner=[];for(let i=0;i<=5;i++){const t=.18+i/5*.5,p=surf(d,azE,lerp(top,bot,t),0),b=sin(PI*t)*.5;inner.push(xf(h,[p[0]+s*d.earOut*b,p[1],p[2]-d.earOut*.3*b]))}
  ink(inner,1,h.seed+44+s);
  if(d.earring&&s>0){const e=outer[7];ctx.fillStyle=ACCENT;dot(e[0],e[1]+3.5*SC,2.4);ctx.fillStyle=INK}};

F.hair=h=>{const d=h.d;if(!h.hr)return;const hp=h.hp,K=HK+1,vis=h.hv||(h.hv=new Uint8Array(NA*HK)),sd=h.seed;
  const dark=d.hair==='black'||d.hair==='bob',solid=d.hair!=='stubble';
  ctx.beginPath();
  for(let i=0;i<NA;i++){const i2=(i+1)%NA;for(let k=0;k<HK;k++){
    const a=(i*K+k)*2,b=(i2*K+k)*2,c=(i2*K+k+1)*2,e=(i*K+k+1)*2;
    const v=((hp[b]-hp[a])*(hp[e+1]-hp[a+1])-(hp[e]-hp[a])*(hp[b+1]-hp[a+1]))<0?1:0;vis[i*HK+k]=v;
    if(v&&solid){ctx.moveTo(hp[a],hp[a+1]);ctx.lineTo(hp[b],hp[b+1]);ctx.lineTo(hp[c],hp[c+1]);ctx.lineTo(hp[e],hp[e+1]);ctx.closePath()}}}
  if(solid){ctx.fillStyle=ctx.strokeStyle=dark?INK:PAPER;ctx.lineWidth=1.3*SC;ctx.lineJoin='round';ctx.fill();ctx.stroke();ctx.fillStyle=INK}
  const P=(i,k)=>{const a=(((i%NA)+NA)%NA*K+k)*2;return [hp[a],hp[a+1]]},V=(i,k)=>vis[((i%NA)+NA)%NA*HK+min(k,HK-1)];
  const ring=(k,w,s)=>{let run=[],s0=0;for(let i=0;i<NA;i++)if(!V(i,k)){s0=i;break}
    for(let n=0;n<=NA;n++){const i=s0+n;if(V(i,k)){if(!run.length)run.push(P(i,k));run.push(P(i+1,k))}else{if(run.length>1)ink(run,w,s);run=[]}}
    if(run.length>1)ink(run,w,s)};
  const comb=(step,k0,k1,w,sw)=>{for(let i=0;i<NA;i+=step){let run=[];for(let k=k0;k<=k1;k++){const fi=i+sw*k,ii=floor(fi),t=fi-ii;
      if(V(ii,k)&&V(ii-1,k)&&V(ii+1,k)){const a=P(ii,k),b=P(ii+1,k);run.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])}else{if(run.length>1)ink(run,w,sd+i*2);run=[]}}if(run.length>1)ink(run,w,sd+i*2)}};
  if(dark){ring(0,2.4,sd+60);ctx.fillStyle=PAPER;const r=RNG(sd+5);
    for(let n=0;n<7;n++){const i=r.int(0,NA-1),k=r.int(1,HK-3);if(V(i,k)&&V(i,k+1)&&V(i-1,k))ink([P(i,k),P(i,k+1),P(i+(r.chance(.5)?1:0),k+2)],1.1,sd+n)}ctx.fillStyle=INK}
  else if(d.hair==='hatch'){ring(0,1.5,sd+60);comb(.5,0,HK-1,.85,d.hairSwirl*.55)}
  else if(d.hair==='beanie'){ring(0,1.7,sd+60);ring(1,1.4,sd+61);comb(1,0,1,.8,0);comb(4,1,HK,.7,0)}
  else if(d.hair==='flatcap'){ring(0,1.9,sd+60);for(let k=2;k<HK;k+=2)ring(k,.8,sd+60+k);comb(5,0,HK,.8,.5)}
  else if(d.hair==='stubble'){for(let i=0;i<NA;i++)for(let k=0;k<HK;k++)if(V(i,k)&&V(i-1,k)){const a=P(i,k),b=P(i+1,k+1);
      for(let n=0;n<2;n++){const u=hash(sd+i*31+k*7+n),v=hash(sd+i*17+k*3+n+99);dot(lerp(a[0],b[0],u),lerp(a[1],b[1],v),.75)}}}
  else if(d.hair==='curly'){for(let k=HK;k>=0;k--)for(let i=0;i<NA;i++)if((i+k)%2===0||k<2)if(V(i,k)||V(i-1,k)){const c=P(i,k),rad=h.S*(.095+.045*hash(sd+i*13+k)),ph=hash(sd+i+k*41)*TAU,lp=[];
      for(let n=0;n<13;n++){const a=ph+n/13*TAU*1.12;lp.push([c[0]+cos(a)*rad*(1-n*.02),c[1]+sin(a)*rad*(1-n*.02)])}
      fillPoly(lp,PAPER);ink(lp,1,sd+i*7+k)}}
  if(d.band){const e1=d.hairFront-.12,e2=e1-.16,lf=d.hairLift*.6+.02,up=curve(h,u=>[(u-.5)*TAU,e1],48,lf),lo=curve(h,u=>[(u-.5)*TAU,e2],48,lf),ru=runs(up,.02),rl=runs(lo,.02);
    for(let n=0;n<min(ru.length,rl.length);n++){fillPoly(ru[n].concat(rl[n].slice().reverse()),PAPER);ink(ru[n],1.4,sd+70);ink(rl[n],1.4,sd+71)}}};

// things that sit proud of the skull: bun, cap brim, pom-pom. pass 0 = behind the head, 1 = in front
F.topper=(h,pass)=>{const d=h.d,sd=h.seed;
  if(d.bun){const c=xf(h,surf(d,PI,.95,.32));if((c[2]>0?1:0)===pass){const r=h.S*.3*(1+c[2]*.11),lp=[];
    for(let n=0;n<14;n++){const a=n/14*TAU;lp.push([c[0]+cos(a)*r,c[1]+sin(a)*r])}
    fillPoly(lp,INK);ink(lp,2,sd+80,true);ctx.fillStyle=PAPER;ink([[c[0]-r*.4,c[1]-r*.3],[c[0],c[1]-r*.55],[c[0]+r*.4,c[1]-r*.35]],1,sd+81);ctx.fillStyle=INK}}
  if(d.hair==='flatcap'){const f=proj(h,0,d.hairFront,.1);if((f[3]>-.2?1:0)===pass){const inn=[],out=[];
    for(let i=0;i<=12;i++){const az=lerp(-1.05,1.05,i/12),p=surf(d,az,hairEl(d,az)+.02,.1),b=cos(az*1.35);inn.push(xf(h,p));out.push(xf(h,[p[0]*(1+.1*b),p[1]+.2*b,p[2]+.44*b]))}
    fillPoly(inn.concat(out.slice().reverse()),PAPER);ink(out,1.7,sd+82);ink(inn,1.3,sd+83)}}
  if(d.hair==='beanie'&&pass===1){const c=xf(h,surf(d,0,PI/2,d.hairLift+.13)),r=h.S*.17,lp=[];
    for(let n=0;n<12;n++){const a=n/12*TAU;lp.push([c[0]+cos(a)*r,c[1]+sin(a)*r])}
    fillPoly(lp,PAPER);ink(lp,1.4,sd+84,true,1.4);for(let n=0;n<5;n++){const a=hash(sd+n)*TAU;ink([[c[0]+cos(a)*r*.2,c[1]+sin(a)*r*.2],[c[0]+cos(a)*r*.85,c[1]+sin(a)*r*.85]],.8,sd+85+n)}}};

F.brow=(h,s)=>{const d=h.d,e=h.ex;if(d.browStyle==='none'&&abs(e.frown)<.3&&e.brow<.35)return;
  if(d.glasses==='shades'&&e.brow<.3&&abs(e.frown)<.3)return;
  const y=d.eyeY+d.eyeH+d.browY+e.brow*.12,x0=s*(d.eyeX-d.eyeW*1.2),x1=s*(d.eyeX+d.eyeW*1.3),tl=d.browTilt+e.frown*.3;
  strokeOn(h,u=>[lerp(x0,x1,u),y+d.browArch*sin(u*PI)*(1+e.brow)+tl*(u-.5)*.4],8,d.browStyle==='thick'?4.2:1.7,h.seed+90+s,.02,.08)};

F.eye=(h,s)=>{const d=h.d,e=h.ex,az0=s*d.eyeX,el0=d.eyeY,ew=d.eyeW,eh=d.eyeH*(1+e.wide*.45),sd=h.seed+100+s*7;
  if(d.glasses==='patch'&&s===d.noseSide)return;
  if(proj(h,az0,el0,.01)[3]<.1)return;
  const th=d.eyeTilt*s,ct=cos(th),st=sin(th),at=(u,v)=>[az0+u*ct-v*st,el0+u*st+v*ct];
  const open=clamp((s<0?e.openL:e.openR)*h.blink*(1-e.squeeze)*(1-e.happy),0,1);
  const round=d.eyeStyle!=='almond',up=x=>round?eh*sqrt(max(0,1-x*x)):eh*pow(max(0,1-x*x),.75),lo=x=>round?-eh*sqrt(max(0,1-x*x)):-eh*.62*(1-x*x);
  if(e.squeeze>.5){ink(curve(h,u=>{const x=abs(u*2-1);return at(s*ew*(x*1.4-.4),(u<.5?1:-1)*eh*.75*x)},6,.012),1.8,sd);return}
  if(open<.14||d.eyeStyle==='dot'&&open<.4){const hp=e.happy>.4;ink(curve(h,u=>{const x=u*2-1;return at(x*ew,hp?eh*.55*(1-x*x):lo(x)*.55)},8,.012),1.9,sd);return}
  const pr=d.pupil*min(ew,eh*1.35)*(1+.25*e.wide),pu=clamp(e.gx*.55-s*e.cross*.6,-.8,.8)*(ew-pr*.6),pv=clamp(e.gy,-.8,.8)*.5*eh-(1-open)*eh*.25;
  const pupil=r=>loopOn(h,u=>at(pu+cos(u*TAU)*r,pv+sin(u*TAU)*r*1.05),10,.014);
  if(d.eyeStyle==='dot'){fillPoly(pupil(pr*(1.15+.3*e.wide)),INK);return}
  const lid=x=>lerp(lo(x),up(x),open),N=9,top=curve(h,u=>at((u*2-1)*ew,lid(u*2-1)),N,.012),bot=curve(h,u=>at((1-u*2)*ew,lo(1-u*2)),N,.012),all=top.concat(bot.slice(1,-1));
  fillPoly(all,'#eee5d9');ctx.save();path(all,1);ctx.clip();
  if(e.dizzy>.5){const sp=curve(h,u=>{const a=u*TAU*2.6+T*7*s,r=u*ew*.95;return at(cos(a)*r,sin(a)*r*.9)},26,.014);ink(sp,1.2,sd+3,false,0)}
  else if(d.iris){ink(pupil(pr*1.75),.9,sd+2,true,0);fillPoly(pupil(pr*.62),INK)}else fillPoly(pupil(pr),INK);
  ctx.restore();ink(top,d.lidHeavy?2.5:1.6,sd);ink(bot,1,sd+1);
  if(d.lidHeavy&&open<.8)ink(curve(h,u=>at((u*2-1)*ew*.85,up(u*2-1)*.95+.012),6,.012),.8,sd+4)};

// the nose is the one thing that leaves the egg: a little 3D fin, paper-filled so it can break the outline in profile
F.nose=(h,pass)=>{const d=h.d,sd=h.seed+200,s=d.noseSide,base=proj(h,0,d.noseTip-.02,0);
  if((base[3]>0?1:0)!==pass||base[3]<-.45)return;
  const top=d.eyeY+.06,B0=surf(d,0,top,0),Tm=surf(d,0,d.noseTip,0),Bs=surf(d,0,d.noseTip-.09,0),mid=surf(d,0,(top+d.noseTip)/2,0);
  const Tp=[0,Tm[1]+d.noseDrop,Tm[2]+d.noseLen],Bm=[0,(B0[1]+Tp[1])/2,max(mid[2],(B0[2]+Tp[2])/2)+d.noseLen*.1],U=[0,Tp[1]+.06,Tp[2]-d.noseLen*.4];
  const wing=k=>{const p=surf(d,k*d.noseW,d.noseTip-.03,.04);return p},off=(p,k)=>[p[0]+k,p[1],p[2]];
  if(pass===1)fillPoly([B0,Bm,Tp,U,Bs].map(p=>xf(h,p)),PAPER);
  const tipS=xf(h,Tp),rootS=xf(h,Tm),side=hypot(tipS[0]-rootS[0],tipS[1]-rootS[1])>h.S*.17;
  if(d.noseStyle==='L'||d.noseStyle==='tri'){
    ink(chaikin([surf(d,s*.075,top+.09,.01),off(Bm,s*.05),off(Tp,s*.02),U,wing(-s)].map(p=>xf(h,p)),false,1),1.7,sd);
    if(d.noseStyle==='tri')ink([wing(-s),off(Bs,0),wing(s),off(Bm,s*.05)].map(p=>xf(h,p)),1.2,sd+1)}
  else{ink(chaikin([wing(s),off(U,s*.07),off(Tp,0),off(U,-s*.07),wing(-s)].map(p=>xf(h,p)),false,1),1.7,sd);
    if(side)ink(chaikin([B0,Bm,Tp].map(p=>xf(h,p)),false,1),1.5,sd+1)}
  if(pass===1&&!side){const n=xf(h,surf(d,s*d.noseW*.55,d.noseTip-.035,.03));dot(n[0],n[1],1)}};

const seen=pts=>pts.filter(p=>p[3]>.02);
F.mouth=h=>{const d=h.d,e=h.ex,sd=h.seed+300,my=d.mouthY,mw=d.mouthW*(1-.6*e.pucker)*(1+.14*max(0,e.smile)),sm=e.smile*.085,open=e.mopen*.36+e.pucker*.07;
  const wob=x=>e.dizzy*.028*sin(x*8+T*5),base=x=>my+sm*(x*x-.4)+wob(x);
  const up=u=>{const x=u*2-1;return [x*mw,base(x)+(1-x*x)*.012*(1+2*e.pucker)]},lo=u=>{const x=1-u*2;return [x*mw,base(x)-(1-x*x)*(open+.012)]};
  if(open<.035){strokeOn(h,up,12,1.8,sd);
    if(d.lips==='lower')strokeOn(h,u=>[(u-.5)*mw*.9,my-.078-sm*.2],4,1,sd+1);
    else if(d.lips==='full')strokeOn(h,u=>{const x=u*2-1;return [x*mw*.7,my-.025-sm*.3-.07*(1-x*x)]},8,1.1,sd+1);
    if(e.smile>.5)for(const s of[-1,1])strokeOn(h,u=>[s*(mw+.02+.018*sin(u*PI)),my+sm*.6+(u-.5)*.08],3,1,sd+2+s);return}
  const U=curve(h,up,10,.012),L=curve(h,lo,10,.012),all=seen(U.concat(L.slice(1,-1)));if(all.length<4)return;
  fillPoly(all,INK);ctx.save();path(all,1);ctx.clip();
  if(e.mopen>.5)fillPoly(loopOn(h,u=>[cos(u*TAU)*mw*.55,my-sm*.4-open*.8+sin(u*TAU)*open*.3],12,.012),ACCENT);
  if(e.smile>.3&&e.mopen>.1&&e.pucker<.3){const th=min(.045,open*.5),Tt=curve(h,u=>{const x=1-u*2,p=up(1-u);return [p[0],p[1]-th*sqrt(max(0,1-x*x))]},10,.012);fillPoly(seen(U.concat(Tt)),PAPER)}
  ctx.restore();ink(all,1.2,sd,true)};

F.stache=h=>{const d=h.d,e=h.ex,t=d.stache;if(t==='none')return;
  const sd=h.seed+400,sy=lerp(d.noseTip-.1,d.mouthY,.55)+e.smile*.02+e.pucker*.015,mw=d.mouthW*1.1;
  if(t==='pencil'){strokeOn(h,u=>{const x=u*2-1;return [x*mw*.9,sy-.025*x*x]},8,2.8,sd);return}
  if(t==='handlebar'){for(const s of[-1,1])strokeOn(h,u=>[s*(.012+mw*1.5*u),sy-.045*sin(u*PI*.9)+.17*u*u*u],9,3.4,sd+s);return}
  const wal=t==='walrus',U=curve(h,u=>{const x=u*2-1;return [x*mw,sy+.04-.035*x*x]},10,.016),L=curve(h,u=>{const x=1-u*2;return [x*mw,sy-(wal?.085:.03)-(wal?.075:.05)*x*x]},10,.016);
  const all=seen(U.concat(L.slice(1,-1)));if(all.length>3){fillPoly(all,INK);ink(all,1.3,sd,true)}};

F.beard=h=>{const d=h.d,t=d.beard;if(t==='none')return;const sd=h.seed+450,my=d.mouthY;
  if(t==='goatee'||t==='soul'){const g=t==='goatee',cy=my-(g?.3:.13),ra=g?.15:.045,rb=g?.14:.05;
    const lp=seen(loopOn(h,u=>[cos(u*TAU)*ra,cy+sin(u*TAU)*rb],12,.015));if(lp.length>3){fillPoly(lp,INK);ink(lp,1.4,sd,true)}return}
  for(const j of h.jawPts){const p=proj(h,j[0],j[1],.012);if(p[3]<.12)continue;
    if(t==='stubble')dot(p[0],p[1],.8);else{const q=proj(h,j[0]+(j[2]-.5)*.05,j[1]-.1,.02);ink([p,q],1,sd+(j[2]*999|0))}}};

F.glasses=h=>{const d=h.d,g=d.glasses;if(g==='none')return;const sd=h.seed+500,m=h.M,k=d.noseSide;
  if(g==='patch'){const lp=seen(loopOn(h,u=>[k*d.eyeX+cos(u*TAU)*.17,d.eyeY+sin(u*TAU)*.15-.02],14,.03));
    strokeOn(h,u=>{const az=(u-.5)*TAU,el=d.eyeY-k*.5*sin(az-k*d.eyeX);return [az,el,el>hairEl(d,az)?d.hairLift*.8+.03:.015]},48,1.5,sd+3,0,.02);
    if(lp.length>3){fillPoly(lp,INK);ink(lp,1.3,sd,true)}return}
  if(m[8]<-.12)return;
  const pe=surf(d,d.eyeX,d.eyeY,0),zf=pe[2]+.14,a=d.eyeW*d.rx*2+.06,b=g==='square'?a*.72:a*.92,pw=g==='square'?5:2,y0=pe[1]-.01;
  const lens=s=>{const lp=[];for(let n=0;n<20;n++){const t=n/20*TAU,cu=cos(t),sv=sin(t);lp.push(xf(h,[s*pe[0]+a*sign(cu)*pow(abs(cu),2/pw),y0+b*sign(sv)*pow(abs(sv),2/pw),zf-.06*abs(cu)]))}return lp};
  for(const s of(g==='monocle'?[k]:[-1,1])){const lp=lens(s);
    if(g==='shades'){fillPoly(lp,INK);ctx.fillStyle=PAPER;ink([lp[11],lp[12],lp[13]],1.3,sd+s);ctx.fillStyle=INK}
    ink(lp,g==='square'?2.7:1.7,sd+s,true,.4);
    if(g==='monocle'&&m[8]>.35){const e0=lp[s>0?2:8],e1=[h.bx+s*h.S*1.05,h.by+h.S*d.ry*1.24],ch=[];for(let n=0;n<=12;n++){const t=n/12;ch.push([lerp(e0[0],e1[0],t)+s*sin(t*PI)*h.S*.22,lerp(e0[1],e1[1],pow(t,.7))+sin(t*PI)*h.S*.1])}ink(ch,.8,sd+9)}
    else if(s*m[6]>-.1)ink([[s*(pe[0]+a),y0-b*.3,zf-.06],surf(d,s*1.58,d.eyeY+d.earY+d.earSize*.55,.04),surf(d,s*1.78,d.eyeY+d.earY+d.earSize*.2,.04)].map(p=>xf(h,p)),1.5,sd+4+s)}
  if(g!=='monocle')ink(chaikin([[-(pe[0]-a),y0-b*.2,zf],[0,y0-b*.5,zf+.03],[pe[0]-a,y0-b*.2,zf]].map(p=>xf(h,p)),false,1),1.6,sd+8)};

F.extras=h=>{const d=h.d,e=h.ex,sd=h.seed+600,wr=(d.wrinkles?.35:0)+e.brow*.9;
  if(wr>.3){const y=d.eyeY+d.eyeH+d.browY+.14+e.brow*.11;for(let k=0;k<3&&y+k*.075<d.hairFront-.07;k++)strokeOn(h,u=>[(u-.5)*(.7-k*.13),y+k*.075+.012*sin(u*PI)],6,.45+wr*.7,sd+k,.012,.1)}
  if(d.bags)for(const s of[-1,1])strokeOn(h,u=>[s*d.eyeX+(u-.5)*d.eyeW*1.5,d.eyeY-d.eyeH*.8-.075+.03*(u-.5)*(u-.5)*4],5,.8,sd+5+s,.012,.1);
  if(d.folds)for(const s of[-1,1])strokeOn(h,u=>[s*(d.noseW+.07+u*.13),lerp(d.noseTip-.02,d.mouthY+.03,u)],5,.9,sd+8+s,.012,.1);
  if(d.freckles)for(const f of h.frk){const p=proj(h,f[0],f[1],.012);if(p[3]>.15)dot(p[0],p[1],.75)}
  if(d.mole){const p=proj(h,d.mole[0],d.mole[1],.012);if(p[3]>.1)dot(p[0],p[1],1.7)}};

/* ───────────────────────── 6. assemble + draw one head ───────────────────────── */
let T=0;const heads=[],FX=[];
function makeHead(seed,x,y,S,col,row){const d=makeDNA(seed),r=RNG(seed^0x9e3779);
  const h={d,seed,bx:x,by:y,cx:x,cy:y,S,col,row,yaw:0,pitch:0,roll:0,hop:0,vyaw:0,vpitch:0,vroll:0,vhop:0,pv:[0,d.ry*.85,-d.rz*.25],blink:1,
    ex:{openL:d.lid,openR:d.lid,wide:0,gx:0,gy:0,brow:0,frown:0,smile:d.mood,mopen:0,pucker:0,dizzy:0,cross:0,happy:0,squeeze:0},tg:{},
    jawPts:[],frk:[],act:null,pending:null,look:null,deco:null,nextAct:r.range(1.5,9),blinkAt:r.range(.3,4),blinkT:-9,wander:{x,y,until:0},r};
  const nj=d.beard==='full'?130:80;for(let i=0;i<900&&h.jawPts.length<nj;i++){const az=r.range(-1.5,1.5),el=r.range(-1.3,-.36);
    if((abs(az)<d.mouthW+.09&&el>d.mouthY-.1&&el<d.mouthY+.06)||el>-.5+abs(az)*.3)continue;h.jawPts.push([az,el,r()])}
  for(let i=0;i<18;i++)h.frk.push([(r.chance(.5)?1:-1)*r.range(.22,.75),r.range(-.34,-.02)]);
  buildSkin(h,NE);buildHair(h);return h}

function star(x,y,r,rot){const p=[];for(let i=0;i<10;i++){const a=rot+i*PI/5,q=i&1?r*.45:r;p.push([x+cos(a)*q,y+sin(a)*q])}fillPoly(p,ACCENT);ink(p,1,7,true,0)}
function drawDeco(h,pass){const k=h.deco;if(!k)return;const d=h.d,S=h.S;
  if(k.type==='stars'){for(let n=0;n<3;n++){const a=T*4.2+n*TAU/3,z=sin(a);if((z>0?1:0)!==pass)continue;
    star(h.cx+cos(a)*S*1.2,h.cy-S*d.ry*1.22+z*S*.2,S*.15*(1+z*.25)*k.amt,a*.7)}}
  else if(k.type==='bubble'){const front=h.M[8]>0?1:0;if(front!==pass||k.size<.02)return;
    const rad=k.size,c=xf(h,(p=>[p[0],p[1],p[2]+rad*.92])(surf(d,0,d.mouthY,0))),R=rad*S*(1+c[2]*.11)*(1+.04*sin(T*9)),lp=[];
    for(let n=0;n<22;n++){const a=n/22*TAU;lp.push([c[0]+cos(a)*R,c[1]+sin(a)*R*.97])}
    ctx.globalAlpha=.9;fillPoly(lp,'#efd3c8');ctx.globalAlpha=1;ctx.fillStyle=ACCENT;ink(lp,1.6,h.seed+700,true);
    const gl=[];for(let n=0;n<=5;n++){const a=-2.4+n*.16;gl.push([c[0]+cos(a)*R*.7,c[1]+sin(a)*R*.7])}ctx.fillStyle=PAPER;ink(gl,1.5,3);ctx.fillStyle=INK}}

function drawHead(h){const d=h.d;SC=h.S/62;BOIL=floor(T*6+d.phase)%3;ctx.fillStyle=INK;
  h.cx=h.bx;h.cy=h.by-h.hop;projectHead(h);
  drawDeco(h,0);F.topper(h,0);F.nose(h,0);F.ear(h,-1,0);F.ear(h,1,0);
  fillPoly(h.out,FACE||PAPER);
  F.extras(h);F.beard(h);F.mouth(h);F.stache(h);F.brow(h,-1);F.brow(h,1);F.eye(h,-1);F.eye(h,1);
  const curly=d.hair==='curly';if(!curly)F.hair(h);
  ink(h.out,1.9,h.seed+20,true);if(curly)F.hair(h);
  F.ear(h,-1,1);F.ear(h,1,1);F.nose(h,1);F.glasses(h);F.topper(h,1);drawDeco(h,1)}
// where things are on screen (for the fly, particles…)
const noseTip=h=>{const d=h.d,p=surf(d,0,d.noseTip,0);return xf(h,[0,p[1]+d.noseDrop,p[2]+d.noseLen])};
const mouthPos=h=>xf(h,surf(h.d,0,h.d.mouthY,.05));


  const cast = new Map();
  function get(client) {
    if (!cast.has(client.seed)) {
      const h = makeHead(client.seed, 0, 0, 24, 0, 0);
      Object.assign(h.d, { rx:clamp(h.d.rx,.82,.96), ry:clamp(h.d.ry,1.08,1.22), jaw:clamp(h.d.jaw,.17,.34), eyeStyle:'almond', eyeW:.15, eyeH:.09, iris:true,
        eyeY:.13, mouthY:-.66, noseStyle:'L', noseLen:clamp(h.d.noseLen,.23,.35), browStyle:'line',
        hair:client.hair || 'black', glasses:client.glasses || 'none', beard:client.beard || 'none',
        stache:'none', collar:'none', freckles:!!client.freckles, wrinkles:!!client.wrinkles,
        bags:false, folds:false, earring:!!client.earring, bun:!!client.bun });
      if (h.d.hair==='bob') { h.d.hairSide=-.85; h.d.hairBack=-1.05; h.d.hairLift=.15; }
      buildSkin(h,NE); buildHair(h); cast.set(client.seed,h);
    }
    return cast.get(client.seed);
  }
  function draw(client, x, y, size, pose, time, dt) {
    const h=get(client); T=time; PAPER=client.skin || '#e5cab2'; INK='#27212a'; ACCENT='#b76664';
    h.bx=x; h.by=y; h.S=size;
    const rgb=PAPER.slice(1).match(/../g).map(n=>parseInt(n,16));
    const tone=f=>'#'+rgb.map(n=>Math.round(clamp(n*f,0,255)).toString(16).padStart(2,'0')).join('');
    FACE=ctx.createRadialGradient(x-size*.4,y-size*.6,size*.1,x,y,size*1.5);FACE.addColorStop(0,tone(1.15));FACE.addColorStop(.55,PAPER);FACE.addColorStop(1,tone(.73));
    const rate=1-Math.exp(-Math.min(.05,dt)*11);
    const targetYaw=clamp(pose.look || 0,-1,1)*.72;
    h.yaw+=(targetYaw-h.yaw)*rate;
    h.pitch+=((pose.pitch || 0)-h.pitch)*rate;
    h.roll+=((pose.roll || 0)-h.roll)*rate;
    const happy=pose.mood==='happy', worried=pose.mood==='worried', surprised=pose.mood==='surprised';
    const targets={openL:1,openR:1,wide:surprised?.65:0,brow:happy?.18:worried?.45:.1,
      frown:worried?.55:0,smile:happy?.95:worried?-.55:.22,
      mopen:pose.talking ? .16+Math.max(0,Math.sin(time*17+client.seed))*.24 : happy?.12:0,
      happy:happy?.5:0,squeeze:0,pucker:0,dizzy:0,cross:0,
      gx:clamp((targetYaw-h.yaw)*2.5,-.8,.8),gy:pose.down?-.5:0};
    for (const key in targets) h.ex[key]+=(targets[key]-h.ex[key])*rate;
    h.d.jd=h.ex.mopen*.13;
    const blinkPhase=(time+client.seed*.173)%3.7;
    h.blink=blinkPhase<.17?1-Math.sin(blinkPhase/.17*Math.PI):1;
    ctx.save(); drawHead(h); ctx.restore();
  }
  return {draw};
}


const WORLD={width:960,height:560,floor:483,pulseRadius:250};
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const approach=(v,target,amount)=>v+clamp(target-v,-amount,amount);

class Game {
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

const colors=['#ddb78b','#c8a3dd','#8ac6bc','#99b8e7','#d99598','#bed498','#e0c97e','#92bbc5','#c4b8a8'];
function drawProject(r,build,t,box){
  const c=r.ctx,p=build.progress,d=build.data,{x,y,w,h}=box;
  c.save();c.translate(x,y);c.scale(w/440,h/260);
  r.round(0,0,440,260,12,'#131c2a','#394658');
  const glow=c.createRadialGradient(220,130,15,220,130,260);glow.addColorStop(0,build.project.color+'16');glow.addColorStop(1,'#131c2a00');c.fillStyle=glow;c.fillRect(0,0,440,260);
  if(build.project.kind==='sudoku'){
    const s=23.5,ox=114,oy=22;
    for(let i=0;i<81;i++){
      const ready=d.givens.has(i)||d.order.indexOf(i)<Math.floor(24+p*57);
      const color=colors[d.solution[i]-1];r.round(ox+(i%9)*s,oy+Math.floor(i/9)*s,s-2,s-2,3,ready?color:'#263143');
      if(ready)r.text(String(d.solution[i]),ox+(i%9)*s+10.5,oy+Math.floor(i/9)*s+16,12,'#15202c');
    }
    for(let i=0;i<9;i++){
      const angle=i*Math.PI*2/9+t*.04,xx=47+Math.cos(angle)*23,yy=122+Math.sin(angle)*48;
      c.strokeStyle='#546f8b55';c.beginPath();c.moveTo(xx,yy);c.lineTo(110,36+i*21);c.stroke();r.circle(xx,yy,5,p>i/11?colors[i]:'#3a4657');
      r.circle(373,45+i*21,4,p>i/10?colors[i]:'#374254');
    }
    r.text('81 cells · 9 colors',220,251,10,'#98aabd');
  }else if(build.project.kind==='controller'){
    c.save();c.translate(220,132);c.scale(1.15,1.15);
    c.beginPath();c.moveTo(-72,-58);c.bezierCurveTo(-125,-54,-143,50,-105,64);c.bezierCurveTo(-75,76,-59,26,-28,26);c.lineTo(28,26);c.bezierCurveTo(59,26,75,76,105,64);c.bezierCurveTo(143,50,125,-54,72,-58);c.quadraticCurveTo(0,-76,-72,-58);
    c.fillStyle=p>.2?'#dddcd3':'#2a3442';c.fill();c.strokeStyle='#89959f';c.lineWidth=2;c.stroke();
    r.round(-75,-63,45,8,3,'#4a5559');r.round(30,-63,45,8,3,'#4a5559');r.circle(0,-35,12,'#34413c');r.circle(0,-35,7,p>.4?'#90c77d':'#59645f');
    r.circle(-59,-19,21,'#87908a');r.circle(-59,-19,15,'#303b3b');r.circle(-59,-20,10,'#465351');r.circle(34,19,19,'#8b948e');r.circle(34,19,13,'#303b3b');
    r.round(-34,1,12,36,2,'#434d49');r.round(-46,13,36,12,2,'#434d49');
    const buttons=[['Y',63,-32,'#d6b55c'],['B',82,-13,'#d6847d'],['A',63,7,'#8dbb79'],['X',44,-13,'#80aad0']];
    buttons.forEach(([label,x,y,color],i)=>{const active=build.tap>0||Math.floor(t*3)%4===i&&p>.4;r.circle(x,y,active?11:9,active?color:'#687773');r.text(label,x,y+4,10,active?'#172421':color);});
    c.restore();
    const tested=Math.floor(p*12);for(let i=0;i<12;i++)r.round(86+i*23,233,16,4,2,i<tested?'#9aca89':'#374153');
  }else if(build.project.kind==='video'){
    for(let i=0;i<3;i++){
      const px=25+i*134;r.round(px,20,124,107,6,'#233247');
      const g=c.createLinearGradient(px,20,px+124,127);g.addColorStop(0,colors[(i+3)%9]);g.addColorStop(1,'#384151');c.fillStyle=g;c.fillRect(px+5,25,114,97);
      c.fillStyle='#16232baa';c.beginPath();c.moveTo(px+5,105);c.lineTo(px+40,50+i*12);c.lineTo(px+100,121);c.lineTo(px+5,121);c.fill();
      r.circle(px+86,49,12,'#f1d6a3');r.text(['01','02','03'][i],px+12,116,11,'#f1e9e0','left');
    }
    r.round(25,142,390,83,5,'#0b131e','#364151');
    d.wave.forEach((v,i)=>{const height=v*27;const active=i/96<p; r.rect(32+i*3.9,182-height/2,2.5,height,active?'#c8a3dd':'#465165');});
    d.cuts.forEach((index,i)=>{const xx=32+index/24*368;if(p>.38+i*.15){r.round(xx,148,31,66,3,'#c6a2ed22','#c6a2ed');r.rect(xx+4,204,23,3,'#c6a2ed');}});
    r.rect(31+Math.min(p,1)*378,145,1.5,76,'#e4d7f2');r.text('rough cut',26,245,10,'#98aabd','left');r.text(p>.83?'3 moments found':'finding the moments',415,245,10,'#c8a3dd','right');
  }else if(build.project.kind==='diff'){
    const columns=[{x:25,color:'#c89790',rows:d.before},{x:232,color:'#91c5ac',rows:d.after}];
    for(const col of columns){r.round(col.x,22,181,211,6,'#172332','#394558');r.round(col.x+13,34,86,5,2,'#667687');
      for(let i=0;i<col.rows.length;i++){const altered=col.x===25?d.removed.includes(col.rows[i]):d.added.includes(col.rows[i]);const active=altered&&p>.3;
        if(active)r.round(col.x+8,62+i*25,165,21,3,col.color+'25');r.text(String(i+1),col.x+14,76+i*25,10,active?col.color:'#73859c','left');
        for(let n=0;n<3;n++)r.round(col.x+34+n*39,68+i*25,20+((i*7+n*13)%16),4,2,active?col.color:'#687e9577');
      }
    }
    const yy=85+Math.sin(t*2)*17;c.strokeStyle=build.project.color;c.lineWidth=2;c.beginPath();c.moveTo(212,yy);c.lineTo(226,yy+12);c.lineTo(212,yy+24);c.stroke();
    r.text(p>.82?'1 removal  ·  2 additions':'compare the originals',220,250,10,'#98aabd');
  }else if(build.project.kind==='controls'){
    const nodes=[[55,72],[55,186],[220,130],[382,72],[382,186]];
    for(const [from,to] of [[0,2],[1,2],[2,3],[2,4]]){c.strokeStyle=p>.25?'#77bba28a':'#455263';c.lineWidth=3;c.beginPath();c.moveTo(...nodes[from]);c.lineTo(...nodes[to]);c.stroke();const q=(t*.6+from*.2)%1;r.circle(nodes[from][0]+(nodes[to][0]-nodes[from][0])*q,nodes[from][1]+(nodes[to][1]-nodes[from][1])*q,4,build.project.color);}
    r.round(174,85,92,90,13,'#1d3433','#75bda2');r.circle(220,123,23,'#304d43');r.text('✓',220,135,32,'#ace0bf');r.text('CONTROL',220,161,9,'#aac6bc');
    for(let i=0;i<4;i++){const [xx,yy]=nodes[[0,1,3,4][i]];r.circle(xx,yy,24,'#1c2934');r.circle(xx,yy,18,p>(i+1)/5?'#77b79a':'#435564');r.text(p>(i+1)/5?'✓':String(i+1),xx,yy+6,17,p>(i+1)/5?'#142720':'#a7b4be');}
    r.text('known signal',55,115,10,'#97adad');r.text('empty sample',55,227,10,'#97adad');r.text(p>.82?'instrument verified':'check the instrument first',244,248,10,'#9dcbb8');
  }else{
    const ox=220,oy=124;
    c.fillStyle='#24393c';c.beginPath();c.moveTo(ox,17);c.lineTo(411,125);c.lineTo(ox,234);c.lineTo(28,125);c.closePath();c.fill();c.strokeStyle='#6d8580';c.stroke();
    for(let i=0;i<6;i++){const home=d.homes[i],xx=ox+(home.x-home.y-1)*53,yy=oy+(home.x+home.y-1)*29;const raised=clampArt((p-i*.085)*2.5,0,1),hh=35*raised;
      r.line([[xx-20,yy],[xx,yy+12],[xx+20,yy],[xx,yy-12],[xx-20,yy]],'#657873',1);
      if(raised){r.poly([[xx-19,yy],[xx,yy+11],[xx,yy+11-hh],[xx-19,yy-hh]],colors[home.hue]);r.poly([[xx,yy+11],[xx+20,yy],[xx+20,yy-hh],[xx,yy+11-hh]],'#9aabac');r.poly([[xx-22,yy-hh],[xx,yy-16-hh],[xx+23,yy-hh],[xx,yy+13-hh]],'#b99181');r.rect(xx+5,yy-hh+15,6,9,'#e7d7a7');}
    }
    for(let i=0;i<3;i++){const q=t*.6+i*2,xx=220+Math.sin(q)*90,yy=142+Math.cos(q)*39;r.circle(xx,yy-6,3.7,colors[i+2]);r.round(xx-3,yy-2,6,8,2,colors[i+4]);}
    r.text('one file · a little life',220,251,10,'#9eb8b2');
  }
  c.restore();
}
function clampArt(n,a,b){return Math.max(a,Math.min(b,n));}

const mono='ui-monospace,SFMono-Regular,Consolas,monospace';
const atlasUrl=new URL('assets/chetas-atlas.webp',document.baseURI).href;

class Renderer {
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.portraits=createPortraits(this.ctx);this.atlas=null;this.time=0;this.lastNow=0;this.lookAt=null;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;}
  async load(){const image=new Image();image.src=atlasUrl;await image.decode();this.atlas=image;}
  rect(x,y,w,h,color){this.ctx.fillStyle=color;this.ctx.fillRect(x,y,w,h);}
  text(s,x,y,size=13,color='#9fafc1',align='center'){const c=this.ctx;c.fillStyle=color;c.font=`500 ${size}px ${mono}`;c.textAlign=align;c.fillText(s,x,y);}
  round(x,y,w,h,r,fill,stroke){const c=this.ctx;c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
  circle(x,y,r,color){const c=this.ctx;c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
  poly(points,color){const c=this.ctx;c.beginPath();c.moveTo(...points[0]);points.slice(1).forEach(p=>c.lineTo(...p));c.closePath();c.fillStyle=color;c.fill();}
  line(points,color,width=1){const c=this.ctx;c.beginPath();c.moveTo(...points[0]);points.slice(1).forEach(p=>c.lineTo(...p));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  shadow(x,y,w=28){const c=this.ctx;c.fillStyle='#02060977';c.beginPath();c.ellipse(x,y+3,w,5,0,0,Math.PI*2);c.fill();}
  avatar(p,name,frame,height=141){
    if(!this.atlas)return;
    const indices=AVATAR.groups[name],f=AVATAR.frames[indices[frame%indices.length]],scale=height/AVATAR.baseHeight,c=this.ctx,landing=(p.land||0)/.2;
    this.shadow(p.x,p.ground,28);c.save();c.translate(p.x,p.y);c.rotate(name==='run'?.045*p.facing:0);c.scale((p.facing||1)*(1+landing*.05),1-landing*.1);c.imageSmoothingEnabled=true;
    c.drawImage(this.atlas,f.x,f.y,f.w,f.h,-f.anchor*scale+6,-f.h*scale,f.w*scale,f.h*scale);c.restore();
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
  bubble(message,x,y,color='#c7ced5',width=205){
    const c=this.ctx,font=this.compact?17:12,lines=[''];c.font=`500 ${font}px ${mono}`;
    for(const word of message.split(' ')){let n=lines.length-1;if(c.measureText(lines[n]+word).width>width-22)lines.push(word+' ');else lines[n]+=word+' ';}
    x=clamp(x,width/2+8,this.view.w-width/2-8);const h=lines.length*(font+4)+14;
    this.round(x-width/2,y,width,h,8,'#202b38ed',color+'55');this.poly([[x-4,y+h],[x+4,y+h],[x,y+h+6]],'#202b38');lines.forEach((line,i)=>this.text(line.trim(),x,y+font+7+i*(font+4),font,color));
  }
  human(client,x,y,side,game,t,dt){
    const c=this.ctx,b=game.build,age=4.5-b.done,happy=b.published,arrival=game.arrival,depart=happy?clamp((age-3.6)/.9,0,1):0;
    const walking=arrival>0||depart>0,phase=t*8+client.seed,stride=walking?Math.sin(phase)*13:Math.sin(t*.7+client.seed)*1.3;
    const bob=walking?Math.abs(Math.sin(phase))*2:Math.sin(t*2+client.seed)*.65;
    x+=side*(arrival*48+depart*45);c.save();c.globalAlpha=clamp(1-Math.max(arrival*.6,depart),0,1);this.shadow(x,y,27);c.translate(x,y-bob);
    c.lineCap='round';c.lineJoin='round';
    const limb=(pts,width,color)=>{this.line(pts,'#18212d',width+2);this.line(pts,color,width);};
    for(const leg of [-1,1]){
      const sway=stride*leg,knee=leg*9+sway*.4,ankle=leg*10+sway;
      limb([[leg*9,-66],[knee,-34],[ankle,-7]],13,'#3a4b5b');this.line([[leg*9+2,-61],[knee+2,-33],[ankle+2,-9]],'#71829355',1.2);
      this.line([[knee-4,-33],[knee+3,-30]],'#223446',1);
      this.round(ankle-7,-11,19,11,4,'#bab7a8','#28323e');this.line([[ankle-5,-2],[ankle+10,-2]],'#e5dec9',2);
      for(let i=0;i<3;i++)this.line([[ankle-2+i*3,-8],[ankle+i*3,-5]],'#6c716f',.9);
    }
    const coat=c.createLinearGradient(-28,-140,28,-63);coat.addColorStop(0,client.shirt);coat.addColorStop(1,'#263744');
    c.beginPath();c.moveTo(-12,-143);c.quadraticCurveTo(-31,-138,-26,-109);c.lineTo(-22,-64);c.quadraticCurveTo(0,-58,22,-64);c.lineTo(26,-109);c.quadraticCurveTo(31,-138,12,-143);c.closePath();c.fillStyle=coat;c.fill();c.strokeStyle='#1c2632';c.lineWidth=1.5;c.stroke();
    this.poly([[-10,-141],[10,-141],[7,-81],[-6,-81]],'#d8d3c5');
    this.poly([[-13,-144],[-4,-126],[-13,-108],[-21,-134]],client.shirt);this.poly([[13,-144],[4,-126],[13,-108],[21,-134]],client.shirt);
    this.line([[-13,-142],[-5,-127],[-12,-109]],'#d6dbd459',1.2);this.line([[13,-142],[5,-127],[12,-109]],'#d6dbd459',1.2);
    this.line([[0,-103],[0,-65]],'#192b3890',1.3);for(let n=0;n<3;n++)this.circle(2,-98+n*12,1.3,'#c1c2b3');
    this.line([[-21,-85],[-10,-88]],'#d3d7cb55',1);this.line([[11,-88],[21,-84]],'#d3d7cb55',1);
    let hands=[[-30,-83],[30,-82]];
    if(walking)hands=[[-28+stride*.65,-88],[28-stride*.65,-86]];
    else if(happy&&age<1.35)hands[side<0?1:0]=[side<0?38:-38,-174+Math.sin(t*6)*3];
    else if(happy&&age<3.6){const clap=5+Math.abs(Math.sin(t*10))*11;hands=[[-clap,-111],[clap,-111]];}
    else if(b.project.kind==='controller')hands=[[-16,-111],[16,-111]];
    else if(b.project.kind==='video'&&side<0)hands[0]=[-32,-134];
    else if(b.age<2.5)hands[side<0?1:0]=[-side*41,-130+Math.sin(t*5)*3];
    else if(b.progress>.6)hands[side<0?1:0]=[-side*23,-116];
    for(let i=0;i<2;i++){
      const s=i?1:-1,hand=hands[i],elbow=[s*35,-110];limb([[s*23,-134],elbow,[hand[0],hand[1]-4]],10,client.shirt);
      this.line([[hand[0]-4,hand[1]-6],[hand[0]+4,hand[1]-6]],'#dbd8c8',4);
      c.save();c.translate(...hand);c.rotate(s*.1);this.round(-4,-4,8,12,3,client.skin,'#695248');
      for(let f=0;f<3;f++)this.line([[-2+f*2,2],[-2+f*2,6]],'#825f503f',.8);
      this.line([[s*4,-1],[s*6,4]],client.skin,3);if(happy&&age<1.35&&i===(side<0?1:0))this.line([[s*3,-3],[s*3,-11]],client.skin,3);c.restore();
    }
    if(!walking&&!happy&&b.project.kind==='controller'){this.round(-19,-117,38,15,5,'#26343e','#8b9b9b');this.circle(-10,-110,3,'#a6c099');this.circle(10,-110,3,'#dc9a92');}
    if(!walking&&!happy&&b.project.kind==='video'&&side<0){this.round(-38,-154,14,24,3,'#182536','#a0b2bc');this.rect(-35,-150,8,15,b.project.color);}
    limb([[0,-155],[0,-141]],13,client.skin);this.line([[-6,-142],[0,-136],[6,-142]],'#e5dfd0',2);
    c.restore();
    c.save();c.globalAlpha=clamp(1-Math.max(arrival*.6,depart),0,1);
    const target=this.lookAt?.x??this.view.w/2,look=clamp((target-x)/300,-.8,.8);
    const talking=game.attention>0&&game.talkingSide===(side<0?0:1);
    this.portraits.draw(client,x,y-182-bob,28,{look,mood:happy?'happy':b.failed?'worried':b.progress>.8?'surprised':'neutral',talking:talking||b.age<2.5||happy&&age<2,pitch:happy?Math.sin(t*6)*.085:0,roll:Math.sin(t*.8+client.seed)*.025,down:b.project.kind==='controller'},t,dt);c.restore();
    if(!depart&&arrival<.2){
      if(talking||side<0&&b.age<3)this.bubble(happy?b.project.reaction:b.project.request,x,y-269,'#c8cfdb',this.compact?200:205);
      else if(side>0&&happy&&age<3.5)this.bubble(b.project.reaction,x,y-269,'#b8dec3',this.compact?210:220);
      else if(happy)this.text('✓',x+side*37,y-186,20,'#a9d7b2');
    }
  }
  github(x,y,size,color='#b9c6d5'){
    const c=this.ctx;c.save();c.translate(x,y);c.scale(size/24,size/24);c.fillStyle=color;
    c.fill(new Path2D('M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-2.08c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.24-1.65-1.24-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1 1.72 2.62 1.22 3.26.93.1-.73.4-1.22.71-1.5-2.5-.28-5.13-1.25-5.13-5.54 0-1.22.44-2.22 1.15-3-.12-.29-.5-1.43.11-2.98 0 0 .94-.3 3.08 1.15a10.8 10.8 0 0 1 5.6 0c2.14-1.45 3.07-1.15 3.07-1.15.62 1.55.24 2.69.12 2.97.72.78 1.15 1.79 1.15 3.01 0 4.3-2.64 5.25-5.15 5.53.4.35.76 1.03.76 2.08v3.09c0 .3.2.65.78.54A11.2 11.2 0 0 0 12 .8Z'));c.restore();
  }
  render(game,now=0){
    this.compact=this.canvas.clientWidth<500;const w=this.compact?640:960,h=this.compact?680:560;
    const dpr=Math.min(2,window.devicePixelRatio||1);
    if(this.canvas.width!==w*dpr||this.canvas.height!==h*dpr){this.canvas.width=w*dpr;this.canvas.height=h*dpr;this.ctx.setTransform(dpr,0,0,dpr,0,0);}
    this.view={w,h,floor:this.compact?613:480};const {floor}=this.view;
    const dt=this.lastNow?Math.min((now-this.lastNow)/1000,.05):0;this.lastNow=now;if(game.mode==='playing')this.time+=dt;
    const t=this.reduced?0:this.time,b=game.build,c=this.ctx,sx=x=>x/960*w;
    this.rect(0,0,w,h,'#101720');
    const light=c.createRadialGradient(w/2,210,20,w/2,290,w*.65);light.addColorStop(0,b.project.color+'15');light.addColorStop(1,'#10172000');c.fillStyle=light;c.fillRect(0,0,w,h);
    this.poly([[0,floor-48],[w,floor-48],[w,h],[0,h]],'#141e28');this.line([[0,floor-48],[w,floor-48]],'#293644');
    for(let i=0;i<11;i++)this.line([[w/2+(i-5)*43,floor-48],[(i-1)*w/8,h]],'#33455525');
    this.artBox=this.compact?{x:45,y:42,w:550,h:325}:{x:215,y:49,w:530,h:313};
    drawProject(this,b,t,this.artBox);
    const by=this.artBox.y+this.artBox.h+17,bx=this.artBox.x,bw=this.artBox.w;
    this.round(bx,by,bw,3,2,'#354252');this.round(bx,by,Math.max(1,bw*b.progress),3,2,b.project.color);
    for(let i=0;i<3;i++){const phase=b.progress>(i===0?.25:i===1?.82:.98);this.circle(bx+8+i*(bw-16)/2,by+1,phase?5:3,phase?b.project.color:'#617084');}
    const status=b.failed?'CHECK FAILED':b.published?'OPEN SOURCE':b.progress>.86?'SHIPPING':b.progress>.73?'CHECKING':'BUILDING';
    this.text(b.project.tag,20,26,this.compact?16:11,'#9bacbd','left');this.text(status,w-49,26,this.compact?15:10,b.published?'#a5d6ae':'#9eafc1','right');this.github(w-40,11,21,b.published?'#a5d6ae':'#a5b6c8');
    this.human(game.cast[0],sx(128),floor-2,-1,game,t,game.mode==='playing'?dt:0);
    this.human(game.cast[1],sx(835),floor-2,1,game,t,game.mode==='playing'?dt:0);
    for(const pulse of game.pulses){c.save();c.globalAlpha=(1-pulse.age/.65)*.8;c.strokeStyle='#baa1e6';c.lineWidth=2;c.beginPath();c.ellipse(sx(pulse.x),floor+21-(WORLD.floor-pulse.y)-50,Math.min(WORLD.pulseRadius,pulse.age*540)*w/960,Math.min(92,pulse.age*220),0,0,Math.PI*2);c.stroke();c.restore();}
    for(const bot of game.bots){
      const view={...bot,x:sx(bot.x),y:floor+7};if(bot.id==='claude')this.clawd(view,t,1.24);else this.codex(view,t,1.18);
      if(bot.buff){c.strokeStyle='#b8a0df80';c.lineWidth=1.5;c.beginPath();c.ellipse(view.x,view.y+3,39,6,0,0,Math.PI*2);c.stroke();}
      if(bot.work){const dir=bot.id==='claude'?1:-1,xx=view.x+dir*36;this.round(xx-21,view.y-32,42,29,3,'#152132','#667b96');this.rect(xx-25,view.y-3,50,3,'#8092a8');
        for(let n=0;n<3;n++)this.rect(xx-15,view.y-25+n*7,9+((Math.floor(t*8)+n*7)%18),2,bot.id==='claude'?'#d6a48c':'#a5c0ee');
        for(let n=0;n<3;n++){const q=(t*.45+n/3)%1;c.globalAlpha=Math.sin(q*Math.PI)*.4;this.circle(xx+(w/2-xx)*q,view.y-47-(view.y-by-30)*q,2,b.project.color);}c.globalAlpha=1;
      }
      this.text(bot.name,view.x,view.y+29,this.compact?17:12,bot.id==='claude'?'#e2a88d':'#a6bff3');
      if(bot.locked){this.round(view.x-17,view.y-125,34,25,5,'#282439','#796890');this.text('J',view.x,view.y-106,17,'#d2bde9');}
      else if(bot.speechTime>0)this.bubble(bot.speech,view.x,view.y-159,bot.id==='claude'?'#e2ac96':'#abc2ef',this.compact?152:151);
    }
    const p=game.player,viewP={...p,x:sx(p.x),y:floor+43-(WORLD.floor-p.y),ground:floor+43};let name='idle',frame=Math.floor(t*3)%8;
    if(p.celebrate){name='actions';frame=12+Math.floor(t*6)%4;}else if(p.cast){name='actions';frame=4+clamp(Math.floor((.6-p.cast)/.15),0,3);}else if(p.y<WORLD.floor){name='actions';frame=p.vy<-160?1:2;}else if(p.land){name='actions';frame=p.land>.09?3:0;}else if(Math.abs(p.vx)>8){name=Math.abs(p.vx)>220?'run':'walk';frame=Math.floor(p.walk)%8;}else if(p.help>.55){name='actions';frame=p.help<.9?8:9+Math.floor(t*7)%2;}
    this.avatar(viewP,name,frame,145);this.text('CHETAS',viewP.x,viewP.y+20,this.compact?15:10,'#b7a5d6');
    if(b.published){const age=4.5-b.done;if(age<1.25){const q=clamp(age/1.25,0,1),xx=w/2+(w-30-w/2)*q,yy=220+(23-220)*q-Math.sin(q*Math.PI)*40;c.save();c.globalAlpha=1-q*.5;this.round(xx-19,yy-13,38,28,4,b.project.color);this.text('{ }',xx,yy+4,14,'#24323f');c.restore();}}
    for(const v of game.particles){c.globalAlpha=clamp(v.life*2,0,1);this.rect(sx(v.x),v.y+(this.compact?26:0),2.5,2.5,v.color);}c.globalAlpha=1;
  }
  hit(x,y){const b=this.artBox;return b&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;}
}

class Sound {
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
    if (type === 'assign') [440,660].forEach((f,i)=>this.note(f,.1,i*.06,'sine',.14));
    else if (type === 'check') [880,1175].forEach((f,i)=>this.note(f,.08,i*.08,'sine',.1));
    else if (type === 'pulse') [220,330,440,660,880].forEach((f,i)=>this.note(f,.22,i*.047,'triangle',.22,pan));
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
    if (Math.abs(g.player.vx)>20 && g.player.vy===0 && g.elapsed-this.lastStep>.27) { this.lastStep=g.elapsed; this.note(90+(Math.floor(g.player.walk)%2)*18,.045,0,'triangle',.15); }
  }
}

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

})();
