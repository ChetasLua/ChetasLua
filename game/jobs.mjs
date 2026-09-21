export const CLIENTS = [
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
export function createCase(slot, cycle = 0) {
  const kind = ['code','math','email'][slot];
  if (kind === 'code') {
    const nums = cycle%2 ? ['4','6','8'] : ['2','3','5'];
    return { kind, title: 'My total is broken', prompt: `Adding ${nums.join(' + ')} gives a string. Can you fix it?`,
      data: nums, expected: nums.reduce((a,b)=>a+Number(b),0),
      stages: ['Reproduce the bug','Convert strings to numbers','Run three checks'],
      before: [`sum([${nums.map(n=>`"${n}"`).join(', ')}])`, `got: "0${nums.join('')}"`, 'expected: a number'],
      patch: ['return values.reduce(', '  (sum, n) => sum + Number(n), 0', ');'] };
  }
  if (kind === 'math') {
    const a = cycle%2 ? 4 : 3, b = cycle%2 ? 8 : 6, answer = cycle%2 ? 7 : 5, total = a*answer+b;
    return {kind,title:'Make this make sense',prompt:`Why does ${a}x + ${b} = ${total}? Walk me through it.`,data:{a,b,total},expected:answer,
      stages:['Find what stays equal','Undo the addition','Divide and substitute'],
      before:[`${a}x + ${b} = ${total}`,'x = ?','Show the working.'],
      patch:[`${a}x = ${total} − ${b}`,`${a}x = ${total-b}`,`x = ${total-b} ÷ ${a}`]};
  }
  const day = cycle%2 ? 'Tuesday' : 'Friday', hour = cycle%2 ? '11am' : '3pm';
  return {kind,title:'Help me find the words',prompt:`Ask Jo to move our chat to ${day}, ${hour}. Friendly, please.`,data:{day,hour},expected:`${day} at ${hour}`,
    stages:['Read the intent','Draft a friendly message','Check the time and tone'],
    before:['To: Jo',`“late. ${day.toLowerCase()} ${hour}?”`,'Could sound a little warmer.'],
    patch:['Hi Jo, could we move our chat',`to ${day} at ${hour}?`,'Thanks for being flexible!']};
}
export function solveCase(job) {
  if (job.kind === 'code') {
    const sum = values => values.reduce((total,n)=>total+Number(n),0);
    const value=sum(job.data), valid=value===job.expected && sum([])===0 && sum(['-2','5'])===3;
    return {valid,value,checks:3,lines:[`sum(...) → ${value}`,'empty list → 0','negative values → 3'],summary:`${value}. Three checks passed.`,reaction:`It returns ${value}! My app works.`};
  }
  if (job.kind === 'math') {
    const {a,b,total}=job.data, value=(total-b)/a, valid=Number.isFinite(value)&&value===job.expected&&a*value+b===total;
    return {valid,value,checks:2,lines:[`x = ${value}`,`${a} × ${value} + ${b} = ${total}`,`${total} = ${total}  ✓`],summary:`x = ${value}. Both sides match.`,reaction:`Oh! x is ${value}. I get it now.`};
  }
  if (job.kind === 'email') {
    const text=job.patch.join('\n'), valid=text.includes('Hi Jo,')&&text.includes(job.expected)&&text.includes('Thanks');
    return {valid,value:text,checks:3,lines:job.patch,summary:'Right time. Clear ask. Kind tone.',reaction:'That actually sounds like me!'};
  }
  return {valid:false,checks:0,lines:[],summary:'Unknown request.',reaction:''};
}
export const caseStage = task => task.done ? 3 : task.progress < .23 ? 0 : task.progress < .73 ? 1 : 2;
export const caseLines = task => task.result && task.progress >= .73 ? task.result.lines : caseStage(task)===0 ? task.job.before : task.job.patch;
