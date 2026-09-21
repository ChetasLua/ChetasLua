const colors=['#ddb78b','#c8a3dd','#8ac6bc','#99b8e7','#d99598','#bed498','#e0c97e','#92bbc5','#c4b8a8'];
export function drawProject(r,build,t,box){
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
