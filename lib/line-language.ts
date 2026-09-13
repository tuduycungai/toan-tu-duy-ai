import {type Construction,type DirectedLine,type LineRef,type Segment} from './geometry';
export type LineReading={text:string;guides:DirectedLine[];points:Construction[];memberships:{point:string;of:Segment}[]};
/** Read named lines before intersections, preserving the same line through all following clauses. */
export function readLineDescriptions(text:string):LineReading{
 const named=new Map<string,DirectedLine>(),points:Construction[]=[],memberships:LineReading['memberships']=[];
 const edge=String.raw`[A-Z]{2}(?![\p{L}\p{N}'′])`,point=String.raw`[A-Z](?![\p{L}\p{N}'′])`;
 const alias=String.raw`[a-z](?:['′])?(?![\p{L}\p{N}'′])`;
 const start=String.raw`(?<![\p{L}\p{N}'′])`,sep=String.raw`(?:\s*[,;]\s*(?:và\s+)?|\s+và\s+)`;
 const direction=String.raw`(song\s+song(?:\s+với)?|vuông\s+góc(?:\s+với)?|∥|⟂)`;
 const ofEdge=String.raw`(?:cạnh\s+|đoạn(?:\s+thẳng)?\s+|đường\s+thẳng\s+)?(${edge})`;
 const segment=(s:string):Segment=>[s[0].toUpperCase(),s[1].toUpperCase()];
 function define(name:string|undefined,through:string,relation:string,of:string){
  const key=name?.toLowerCase()||'@'+named.size,line:DirectedLine={through:through.toUpperCase(),of:segment(of),relation:/vuông|⟂/iu.test(relation)?'perpendicular':'parallel',...(name?{name:key}:{})};
  if(named.has(key)&&JSON.stringify(named.get(key))!==JSON.stringify(line))throw Error('Đường '+key+' đang có hai định nghĩa khác nhau.');named.set(key,line);return key;
 }
 // A short internal marker carries an unnamed/implicit line into "..., cắt AD ...".
 const marker=(key:string)=>'@@'+[...named.keys()].indexOf(key)+'@@';
 const saveDefinition=(clause:string,name:string|undefined,through:string,rel:string,of:string,offset:number,whole:string)=>{
  const key=define(name,through,rel,of),next=whole.slice(offset+clause.length);
  return /^[\s,;]*(?:và\s+)?cắt/iu.test(next)?marker(key)+' ':' ';
 };
 const throughFirst=new RegExp(String.raw`${start}(?:qua\s+(?:điểm\s+)?|từ\s+điểm\s+)(${point})\s*[,;]?\s*(?:vẽ|kẻ|dựng)\s+(?:một\s+)?(?:đường\s+thẳng\s+)?(?:(${alias})\s+)?${direction}\s*${ofEdge}`,'giu');
 text=text.replace(throughFirst,(clause,through,name,rel,of,offset,whole)=>saveDefinition(clause,name,through,rel,of,offset,whole));
 const lineFirst=new RegExp(String.raw`${start}(?:đường\s+thẳng\s+)?(${alias})\s+(?:đi\s+)?qua\s+(?:điểm\s+)?(${point})\s*(?:,\s*|và\s+)?${direction}\s*${ofEdge}`,'giu');
 text=text.replace(lineFirst,(clause,name,through,rel,of,offset,whole)=>saveDefinition(clause,name,through,rel,of,offset,whole));
 const throughOnly=new RegExp(String.raw`${start}(?:kẻ|vẽ|dựng)\s+(?:đường\s+thẳng\s+)?(${alias})\s+(?:đi\s+)?qua\s+(?:điểm\s+)?(${point})\s*(?:,\s*|và\s+)?${direction}\s*${ofEdge}`,'giu');
 text=text.replace(throughOnly,(clause,name,through,rel,of,offset,whole)=>saveDefinition(clause,name,through,rel,of,offset,whole));
 const namePattern=String.raw`(?:@@\d+@@|${edge}|${alias})`;
 function line(s:string):LineRef{
  if(/^@@\d+@@$/.test(s)){const result=[...named.values()][Number(s.slice(2,-2))];if(!result)throw Error('Chưa xác định đường vừa dựng.');return result;}
  if(/^[a-z]{2}$/i.test(s))return segment(s);
  const result=named.get(s.toLowerCase());if(!result)throw Error('Chưa có định nghĩa đường '+s+'.');return result;
 }
 function cut(a:string,b:string,n:string,isSide:boolean){const refs:[LineRef,LineRef]=[line(a),line(b)],name=n.toUpperCase();points.push({name,op:'intersection',lines:refs});if(isSide&&Array.isArray(refs[1]))memberships.push({point:name,of:refs[1]});}
 const qualifier=String.raw`(?:(?:hai|các)\s+)?(?:(cạnh|đoạn(?:\s+thẳng)?|đường\s+thẳng|đường\s+chéo)\s+)?`;
 const cutting=String.raw`(?:cắt|giao\s+(?:với|nhau\s+với))`;
 const localSep=String.raw`[\s,;]*(?:và\s+)?`;
 // d cắt hai cạnh AD và BC lần lượt tại M và N.
 const many=new RegExp(String.raw`${start}(?:đường\s+thẳng\s+)?(${namePattern})${localSep}${cutting}\s+${qualifier}(${edge}(?:${sep}${edge}){1,3})\s+(?:lần\s+lượt\s+)?tại\s+(${point}(?:${sep}${point}){1,3})`,'giu');
 text=text.replace(many,(_clause,a,kind,edges,names)=>{const es=[...edges.matchAll(new RegExp(start+edge,'giu'))].map(m=>m[0]),ns=[...names.matchAll(new RegExp(start+point,'giu'))].map(m=>m[0]);if(es.length!==ns.length)throw Error('Số giao điểm và số đường bị cắt chưa khớp.');es.forEach((b,i)=>cut(a,b,ns[i],/cạnh|đoạn/iu.test(kind||'')));return ' ';});
 // d cắt AD tại M và BC tại N.
 const paired=new RegExp(String.raw`${start}(?:đường\s+thẳng\s+)?(${namePattern})${localSep}${cutting}\s+${qualifier}(${edge})\s+tại\s+(${point})${sep}(?:cắt\s+)?${qualifier}(${edge})\s+tại\s+(${point})`,'giu');
 text=text.replace(paired,(_clause,a,kind1,b,m,kind2,c,n)=>{cut(a,b,m,/cạnh|đoạn/iu.test(kind1||''));cut(a,c,n,/cạnh|đoạn/iu.test(kind2||''));return ' ';});
 const single=new RegExp(String.raw`${start}(?:đường\s+thẳng\s+)?(${namePattern})${localSep}${cutting}\s+${qualifier}(${namePattern})\s+tại\s+(?:điểm\s+)?(${point})`,'giu');
 text=text.replace(single,(_clause,a,kind,b,n)=>{cut(a,b,n,/cạnh|đoạn/iu.test(kind||''));return ' ';});
 // AC và BD cắt nhau tại O.
 const together=new RegExp(String.raw`${start}(${namePattern})\s+và\s+(${namePattern})\s+(?:cắt|giao)\s+nhau\s+tại\s+(${point})`,'giu');
 text=text.replace(together,(_clause,a,b,n)=>{cut(a,b,n,false);return ' ';});
 return {text,guides:[...named.values()],points,memberships};
}
