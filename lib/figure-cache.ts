export type SavedFigure={latex:string;svg:string};
const KEY='ai-tutor-figures-v6.3';
const memory=new Map<string,SavedFigure>();
const identity=(problem:string)=>problem.normalize('NFC').trim().replace(/\s+/g,' ');
export function readFigure(problem:string):SavedFigure|null{
 const key=identity(problem),cached=memory.get(key);if(cached)return cached;
 try{
  const raw=sessionStorage.getItem(KEY);if(!raw||raw.length>1600000)return null;
  const value=JSON.parse(raw);if(value.version!==1||!Number.isFinite(value.savedAt)||Date.now()-value.savedAt>12*60*60*1000||value.savedAt>Date.now()+60000||!Array.isArray(value.entries))return null;
  for(const entry of value.entries.slice(-3)){
   if(!Array.isArray(entry)||typeof entry[0]!=='string'||entry[0].length>26000)continue;
   const saved=entry[1];if(typeof saved?.latex!=='string'||saved.latex.length>26000||typeof saved.svg!=='string'||saved.svg.length>700000||!saved.svg.includes('<svg'))continue;
   memory.set(entry[0],{latex:saved.latex,svg:saved.svg});
  }
  while(memory.size>3)memory.delete(memory.keys().next().value!);
  return memory.get(key)||null;
 }catch{return null;}
}
export function saveFigure(problem:string,figure:SavedFigure){
 const key=identity(problem);memory.delete(key);memory.set(key,figure);
 while(memory.size>3)memory.delete(memory.keys().next().value!);
 try{
  const entries=[...memory].filter(([,v])=>v.svg.length<=700000);
  while(entries.length&&JSON.stringify(entries).length>1500000)entries.shift();
  sessionStorage.setItem(KEY,JSON.stringify({version:1,savedAt:Date.now(),entries}));
 }catch{/* A full or disabled session store must not remove the displayed figure. */}
}
