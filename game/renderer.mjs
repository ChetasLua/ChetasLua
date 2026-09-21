import { WORLD, clamp } from './engine.mjs';
import { AVATAR } from './atlas.mjs';
import { createPortraits } from './portraits.mjs';
import { drawProject } from './project-art.mjs';
const mono='ui-monospace,SFMono-Regular,Consolas,monospace';
const atlasUrl=new URL('../assets/chetas-atlas.webp',import.meta.url).href;

export class Renderer {
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
