import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import ts from 'typescript';import React from 'react';import {create,act} from 'react-test-renderer';import {moduleURL} from './load-ts.mjs';
let source=readFileSync(new URL('../components/tikz-figure.tsx',import.meta.url),'utf8').replace(/import \{TheoryPanel\}[^\n]+/,'const TheoryPanel=()=>null;').replace(/import \{compileGeometry\}[^\n]+/,'const compileGeometry=()=>null;').replace(/import \{compileTikz\}[^\n]+/,'const compileTikz=(...args)=>globalThis.__v624Compiler(...args);');
let js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
js=js.replace(/from (['"])([^'"]+)\1/g,(_,q,p)=>'from '+q+(p.startsWith('.')?moduleURL(p.endsWith('.ts')?p:p+'.ts',new URL('../components/tikz-figure.tsx',import.meta.url)):import.meta.resolve(p))+q);
const {ProblemFigure}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const latex=readFileSync(new URL('./fixtures/right-isosceles.tex',import.meta.url),'utf8');const good=()=>Response.json({latex,question:''});
const originalFetch=globalThis.fetch;globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.location={origin:'http://test'};
// V6.2 selects manual drawing on touch devices. These existing compiler tests
// exercise desktop behavior and need the browser API in their Node environment.
const originalMatchMedia=globalThis.matchMedia;globalThis.matchMedia=()=>({matches:false});
globalThis.document=Object.assign(new EventTarget(),{hidden:false});
async function setup(responses,props={}){
 let calls=0,root,pending;const sent=[];
 globalThis.fetch=async()=>{calls++;return (responses[calls-1]||good)();};
 globalThis.__v624Compiler=(code,signal)=>new Promise((resolve,reject)=>{sent.push(code);pending={resolve,reject};signal.addEventListener('abort',()=>reject(new DOMException('Cancelled','AbortError')),{once:true});});
 await act(async()=>{root=create(React.createElement(ProblemFigure,{problem:'fixture '+Math.random(),accessCode:'fixture',...props}));});
 const complete=async(type='compiled')=>{await act(async()=>{if(type==='compiled')pending.resolve('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L1 1"/></svg>');else pending.reject(Error('Undefined control sequence'));});};
 return {root,sent,complete,calls:()=>calls,close:()=>act(async()=>root.unmount())};
}
test('V6.2.4 parent uses shared compiler and shows its completed result',async()=>{const r=await setup([good]);try{assert.equal(r.calls(),1);await r.complete();assert.equal(r.root.root.findAllByType('img').length,1);assert.equal(r.root.root.findAllByType('iframe').length,0);}finally{await r.close();}});
test('V6.1 chat redraw forces a new request and does not reuse cached code',async()=>{const problem='redraw fixture';const r=await setup([good,good],{problem});try{await r.complete();await act(async()=>r.root.update(React.createElement(ProblemFigure,{problem,accessCode:'fixture',redrawToken:1})));assert.equal(r.calls(),2);assert.equal(r.root.root.findAllByType('img').length,1);await r.complete();assert.equal(r.root.root.findAllByType('img').length,1);}finally{await r.close();}});
test('V6.1 malformed JSON response is automatically repaired once before compiling',async()=>{const r=await setup([()=>Response.json({}),good]);try{assert.equal(r.calls(),2);await r.complete();assert.equal(r.root.root.findAllByType('img').length,1);}finally{await r.close();}});
test('V6.1 compiler error runs a single repair and then succeeds',async()=>{const r=await setup([good,good]);try{await r.complete('error');assert.equal(r.calls(),2);await r.complete();assert.equal(r.root.root.findAllByType('img').length,1);}finally{await r.close();}});
test('V6.1 repeated format failure stops instead of remaining in loading state',async()=>{const r=await setup([()=>Response.json({}),()=>Response.json({})]);try{assert.equal(r.calls(),2);assert.equal(r.root.root.findAllByProps({role:'status'}).length,0);assert.equal(r.root.root.findAllByProps({role:'alert'}).length,1);}finally{await r.close();}});
test('V6.3 completed figure survives repeated chat busy states and explicit redraw is consumed once',async()=>{
 const problem='stable conversation figure';const r=await setup([good,good],{problem});
 try{
  await r.complete();const src=r.root.root.findByType('img').props.src;
  for(const suspended of [true,false,true,false]){await act(async()=>r.root.update(React.createElement(ProblemFigure,{problem,accessCode:'fixture',suspended})));assert.equal(r.root.root.findByType('img').props.src,src);}
  assert.equal(r.calls(),1);
  await act(async()=>r.root.update(React.createElement(ProblemFigure,{problem,accessCode:'fixture',redrawToken:1})));
  assert.equal(r.calls(),2);assert.equal(r.root.root.findByType('img').props.src,src);await r.complete();
  for(const suspended of [true,false,true,false])await act(async()=>r.root.update(React.createElement(ProblemFigure,{problem,accessCode:'fixture',redrawToken:1,suspended})));
  assert.equal(r.calls(),2);assert.equal(r.root.root.findAllByType('img').length,1);
 }finally{await r.close();}
});
test('V6.3 cache survives leaving the view and disconnecting; reconnection never redraws an existing figure',async()=>{
 const problem='cached view fixture';const first=await setup([good],{problem});await first.complete();await first.close();
 const second=await setup([],{problem,accessCode:''});
 try{
  assert.equal(second.calls(),0);assert.equal(second.root.root.findAllByType('img').length,1);
  await act(async()=>second.root.update(React.createElement(ProblemFigure,{problem,accessCode:'fixture'})));
  assert.equal(second.calls(),0);
 }finally{await second.close();}
});
test('V6.3 failed redraw preserves the previous image without retry on the next answer',async()=>{
 const problem='failed redraw stable fixture';const r=await setup([good,()=>Response.json({error:'quota'},{status:429})],{problem});
 try{
  await r.complete();const src=r.root.root.findByType('img').props.src;
  await act(async()=>r.root.update(React.createElement(ProblemFigure,{problem,accessCode:'fixture',redrawToken:1})));
  assert.equal(r.calls(),2);assert.equal(r.root.root.findByType('img').props.src,src);
  for(const suspended of [true,false])await act(async()=>r.root.update(React.createElement(ProblemFigure,{problem,accessCode:'fixture',redrawToken:1,suspended})));
  assert.equal(r.calls(),2);
 }finally{await r.close();}
});
test.after(()=>{delete globalThis.__v624Compiler;globalThis.fetch=originalFetch;globalThis.matchMedia=originalMatchMedia;});
