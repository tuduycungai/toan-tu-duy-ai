import {useMemo} from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {mathParts,mathFallback,safeMathSource} from '../lib/math-parts';
function Formula({source,display}:{source:string;display:boolean}){
 const html=useMemo(()=>{if(!safeMathSource(source))return null;try{return katex.renderToString(source,{displayMode:display,throwOnError:true,trust:false,strict:'ignore',maxExpand:200,maxSize:10,output:'htmlAndMathml'});}catch{return null;}},[source,display]);
 return html?<span className={display?'math-formula math-display':'math-formula'} dangerouslySetInnerHTML={{__html:html}}/>:<span className="math-fallback">{mathFallback(source)}</span>;
}
/** Only KaTeX-generated markup is inserted; surrounding/model HTML stays escaped React text. */
export function MathText({text}:{text:string}){
 const normalized=text.replace(/\n[\t ]*\n(?:[\t ]*\n)+/g,'\n\n');
 return <>{mathParts(normalized).map((p,i)=>p.type==='text'?<span key={i}>{p.value}</span>:<Formula key={i} source={p.value} display={p.type==='display'}/>)}</>;
}
