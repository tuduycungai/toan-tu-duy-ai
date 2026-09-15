import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readdirSync,readFileSync} from 'node:fs';
const dir='research/release-checks';mkdirSync(dir,{recursive:true});
const results=[];
for(const [id,command,args] of [
 ['npm-test','npm',['test']],
 ['typescript','npx',['tsc','--noEmit']],
 ['build','npm',['run','build']],
 ['test-events','node',['--test','--test-reporter=./scripts/test-report.mjs',...readdirSync('tests').filter(f=>f.endsWith('.test.mjs')).sort().map(f=>'tests/'+f)]],
]) {
 const startedAt=new Date().toISOString(),start=performance.now();
 const r=spawnSync(command,args,{encoding:'utf8',timeout:180000,maxBuffer:20_000_000});
 const file=id==='test-events'?'tests.jsonl':id+'.log';
 writeFileSync(dir+'/'+file,r.stdout||'');if(r.stderr)writeFileSync(dir+'/'+id+'-stderr.log',r.stderr);
 results.push({id,command:[command,...args].join(' '),startedAt,finishedAt:new Date().toISOString(),durationMs:performance.now()-start,exitCode:r.status,error:r.error?.message||'',log:file});
 console.log(id+': '+(r.status===0?'PASS':'FAIL'));
 if(r.status!==0){writeFileSync(dir+'/commands.json',JSON.stringify(results,null,2));process.exit(1);}
}
const tests=readFileSync(dir+'/tests.jsonl','utf8').trim().split('\n').map(l=>JSON.parse(l));
writeFileSync(dir+'/commands.json',JSON.stringify(results,null,2));
writeFileSync(dir+'/summary.json',JSON.stringify({recordedAt:new Date().toISOString(),tests:tests.length,pass:tests.filter(t=>t.status==='pass').length,fail:tests.filter(t=>t.status==='fail').length,skip:tests.filter(t=>t.status==='skip').length,commands:results},null,2));
console.log(JSON.stringify({tests:tests.length,pass:tests.filter(t=>t.status==='pass').length,skip:tests.filter(t=>t.status==='skip').length}));
