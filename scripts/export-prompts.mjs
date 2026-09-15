import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {instructions} from '../server/policy.mjs';
const dir='research/provenance/prompts';await mkdir(dir,{recursive:true});
const levels=['Mất gốc','Cơ bản','Khá','Giỏi','Học sinh năng khiếu'];
const snapshots=[];
for(const mode of ['guide','review','compare']){
 for(const [index,level] of levels.entries()){
  if(mode!=='guide'&&index!==1)continue;
  const messages=[{role:'user',content:'[Bối cảnh học tập tự khai] '+JSON.stringify({mucDo:level,khoi:'8',mon:'Hình học tứ giác lớp 8'})+'\n[Yêu cầu học sinh]\nCho hình bình hành ABCD.'}];
  const prompt=instructions(mode,messages),name=mode+'-level-'+(index+1)+'.txt';
  await writeFile(dir+'/'+name,prompt+'\n');
  snapshots.push({name,mode,level,sha256:createHash('sha256').update(prompt+'\n').digest('hex')});
 }
}
await writeFile(dir+'/manifest.json',JSON.stringify({capturedAt:new Date().toISOString(),kind:'Configuration snapshots, not live Gemini conversations',modelDefault:'gemini-2.5-flash',snapshots},null,2));
console.log('Exported '+snapshots.length+' application prompt configurations.');
