/** Generate self-contained, offline visual fixtures from the same React components and fonts. */
import {build} from 'vite';import react from '@vitejs/plugin-react';import {mkdir,writeFile} from 'node:fs/promises';
const results=await build({configFile:false,plugins:[react()],logLevel:'warn',build:{write:false,lib:{entry:'qa/preview.tsx',name:'TutorQA',formats:['iife'],fileName:'preview'},cssCodeSplit:false,minify:true}});
const outputs=(Array.isArray(results)?results:[results]).flatMap(x=>x.output);
const js=outputs.filter(x=>x.type==='chunk').map(x=>x.code).join('\n').replace(/<\/script/gi,'<\\/script');
const css=outputs.filter(x=>x.type==='asset'&&x.fileName.endsWith('.css')).map(x=>String(x.source)).join('\n');
await mkdir('qa/output',{recursive:true});
await writeFile('qa/output/preview.html','<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Kiểm tra AI Tutor V4.4</title><style>'+css+'</style><div id="root"></div><script>'+js+'</script></html>');
await writeFile('qa/output/mobile.html','<!doctype html><html lang="vi"><meta charset="utf-8"><title>Khung kiểm tra điện thoại</title><h1>Khung 375px, 430px và 1024px</h1><p>Mô phỏng chiều rộng, không thay thế thử trên Safari/iPhone thật.</p>'+[375,430,1024].map(width=>'<h2>'+width+' px</h2><iframe title="Khung '+width+'px" src="preview.html" width="'+width+'" height="1100" style="border:1px solid #b0c7b2"></iframe>').join('')+'</html>');
console.log('Generated qa/output/preview.html and mobile.html with local fonts; no network calls in fixtures.');
