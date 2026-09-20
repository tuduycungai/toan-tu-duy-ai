import fs from 'node:fs';
import {createRequire} from 'node:module';
const root=process.argv[2]||process.cwd();
const require=createRequire(root+'/package.json'),ts=require('typescript');
const out=root+'/research/v622-checks',log=fs.readFileSync(out+'/npm-test.log','utf8');
const records=[...log.matchAll(/^([✔✖﹣]) ([\s\S]*?) \(([\d.]+)ms\)([^\n]*)/gm)].map((m,i)=>({
 id:`KT${String(i+1).padStart(3,'0')}`,name:m[2],file:'',status:({'✔':'Đạt','✖':'Lỗi','﹣':'Bỏ qua'})[m[1]],duration_ms:Number(m[3]),log_line:log.slice(0,m.index).split('\n').length,note:m[4].replace(/^\s*#\s*/,''),
}));
if(records.length!==Number(log.match(/ℹ tests (\d+)/)[1]))throw Error('Missing test rows');
const patterns=[],escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function pattern(n){
 if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n))return escape(n.text);
 if(ts.isTemplateExpression(n))return escape(n.head.text)+n.templateSpans.map(x=>'[\\s\\S]*'+escape(x.literal.text)).join('');
 if(ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.PlusToken)return pattern(n.left)+pattern(n.right);
 return '[\\s\\S]*';
}
for(const file of fs.readdirSync(root+'/tests').filter(x=>x.endsWith('.test.mjs'))){
 const tree=ts.createSourceFile(file,fs.readFileSync(root+'/tests/'+file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 function visit(n){
  if(ts.isCallExpression(n)&&n.arguments.length&&(n.expression.getText(tree)==='test'||n.expression.getText(tree).endsWith('.test'))){
   const p=pattern(n.arguments[0]);if(p!=='[\\s\\S]*')patterns.push({file:'tests/'+file,regex:new RegExp('^'+p+'$')});
  }
  ts.forEachChild(n,visit);
 }
 visit(tree);
}
for(const r of records){const files=[...new Set(patterns.filter(p=>p.regex.test(r.name)).map(p=>p.file))];r.file=files.length===1?files[0]:'Xem dòng nhật ký';}
const commands=JSON.parse(fs.readFileSync(out+'/commands.json','utf8'));
const data={version:'6.2.2',test_run_utc:commands[0].started_at_utc,tests:records,commands,startup:JSON.parse(fs.readFileSync(out+'/start-result.json','utf8'))};
fs.writeFileSync(out+'/test-results.json',JSON.stringify(data,null,2)+'\n');
const csv=v=>'"'+String(v).replaceAll('"','""')+'"';
fs.writeFileSync(out+'/test-results.csv','\uFEFF'+[['Mã','Tệp kiểm thử','Tên kiểm thử','Kết quả','Thời gian ms','Dòng nhật ký','Ghi chú'],...records.map(t=>[t.id,t.file,t.name,t.status,t.duration_ms,t.log_line,t.note])].map(r=>r.map(csv).join(',')).join('\n'));
console.log(JSON.stringify({cases:records.length,passed:records.filter(t=>t.status==='Đạt').length,skipped:records.filter(t=>t.status==='Bỏ qua').length,sourceMapped:records.filter(t=>t.file.startsWith('tests/')).length}));
