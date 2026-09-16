import {readFileSync} from 'node:fs';
import ts from 'typescript';
const cache=new Map();
export function moduleURL(relative,base=new URL('../',import.meta.url)){
 const url=new URL(relative,base);if(cache.has(url.href))return cache.get(url.href);
 const source=readFileSync(url,'utf8');
 // Erase type-only imports before following the runtime graph. This avoids encoding
 // the geometry graph into theory tests that only import its TypeScript types.
 let js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 js=js.replace(/from\s+(['"])(\.\.?\/[^'"]+)\1/g,(_,q,path)=>'from '+q+moduleURL(path.endsWith('.ts')?path:path+'.ts',url)+q);
 const result='data:text/javascript;base64,'+Buffer.from(js).toString('base64');cache.set(url.href,result);return result;
}
export const loadTS=path=>import(moduleURL(path));
