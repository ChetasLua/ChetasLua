// Adapted from Chetas's Head Cases drawing code (Claude Code, September 19, 2026).
// Features live on a shaped 3D skull; changing yaw, pitch and expression moves the geometry.
export function createPortraits(ctx) {
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
