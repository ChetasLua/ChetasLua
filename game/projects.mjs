// Public repository descriptions verified against ChetasLua's GitHub on 2026-09-21.
export const PROJECTS = [
  {id:'sudoku',repo:'sudoku-graph-coloring',title:'Sudoku, in living color',tag:'math → art',color:'#9ac4f6',request:'Can you make the logic visible?',reaction:'Now I can see how it works.',kind:'sudoku'},
  {id:'controller',repo:'xbox360-svg-controller',title:'A controller made of SVG',tag:'code → play',color:'#a8d291',request:'Build something I can play with.',reaction:'Even the buttons feel alive.',kind:'controller'},
  {id:'video',repo:'jevmeter',title:'Find the moments. Make the cut.',tag:'video → edit',color:'#d6abed',request:'There’s a great edit in here.',reaction:'That’s the cut I was looking for.',kind:'video'},
  {id:'diff',repo:'scrubwatch',title:'The words that changed',tag:'history → evidence',color:'#e2b793',request:'Show me what changed.',reaction:'There it is. The whole change.',kind:'diff'},
  {id:'controls',repo:'negative-controls',title:'Test the test',tag:'claims → checks',color:'#83d1b8',request:'Can we trust this result?',reaction:'Now that’s a result I trust.',kind:'controls'},
  {id:'world',repo:'little-neighbourhood',title:'A little world, made of code',tag:'code → life',color:'#edc77d',request:'Make a tiny place feel alive.',reaction:'I could watch this all day.',kind:'world'}
].map(p=>({...p,url:`https://github.com/ChetasLua/${p.repo}`}));

export function shuffled(items,random) {
  const list=[...items];
  for(let i=list.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
  return list;
}
export function makeBuild(project,random) {
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
export function verifyBuild(build){
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
