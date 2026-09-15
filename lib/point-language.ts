import type {Segment} from './geometry';

/** Placement grammar: the order of each point/side pair is retained. */
export function readPointPlacements(source:string){
 const items:{point:string;of:Segment}[]=[];
 const boundary=String.raw`(?<![\p{L}\p{N}'′])`,end=String.raw`(?![\p{L}\p{N}'′])`;
 const point=String.raw`[A-Z]${end}`,side=String.raw`[A-Z]{2}${end}`;
 const sep=String.raw`(?:\s*[,;]\s*(?:và\s+)?|\s+và\s+)`;
 const noun=String.raw`(?:(?:các|hai)\s+)?(?:(?:cạnh(?:\s+bên)?|đoạn(?:\s+thẳng)?)\s+)?`;
 const order=String.raw`(?:(?:lần\s+lượt|theo\s+thứ\s+tự|theo\s+lần\s+lượt)\s+)?`;
 const free=String.raw`(?:\s+(?:tùy\s+ý|tuỳ\s+ý|bất\s+kì|bất\s+kỳ))?`;
 function save(names:string,sides:string){
  const ns=names.match(/[A-Z]/gi)||[],ss=sides.match(/[A-Z]{2}/gi)||[];
  if(ns.length!==ss.length)throw Error('Số điểm và số cạnh trong cụm “lần lượt” chưa khớp.');
  ns.forEach((n,i)=>items.push({point:n.toUpperCase(),of:ss[i].toUpperCase().split('') as Segment}));return ' ';
 }
 const lists=new RegExp(String.raw`${boundary}trên\s+${noun}(${side}(?:${sep}${side}){1,5})\s+${order}(?:lấy|chọn)\s+${order}(?:(?:các|hai)\s+)?(?:điểm\s+)?(${point}(?:${sep}${point}){1,5})${free}`,'giu');
 source=source.replace(lists,(_m,s,n)=>save(n,s));
 const before=new RegExp(String.raw`${boundary}(?:lấy|chọn)\s+(?:(?:các|hai)\s+)?(?:điểm\s+)?(${point}(?:${sep}${point}){1,5})\s+${order}(?:trên|thuộc)\s+${noun}(${side}(?:${sep}${side}){1,5})${free}`,'giu');
 source=source.replace(before,(_m,n,s)=>save(n,s));
 const ordered=new RegExp(String.raw`${boundary}(?:(?:các|hai)\s+)?(?:điểm\s+)?(${point}(?:${sep}${point}){1,5})\s+${order}(?:nằm\s+trên|thuộc|trên)\s+${noun}(${side}(?:${sep}${side}){1,5})`,'giu');
 source=source.replace(ordered,(_m,n,s)=>save(n,s));
 const single=new RegExp(String.raw`${boundary}trên\s+${noun}(${side})\s+${order}(?:lấy|chọn)\s+(?:điểm\s+)?(${point})${free}`,'giu');
 source=source.replace(single,(_m,s,n)=>save(n,s));
 const pointFirst=new RegExp(String.raw`${boundary}(?:lấy|chọn)\s+(?:điểm\s+)?(${point})${free}\s+(?:trên|thuộc)\s+${noun}(${side})`,'giu');
 source=source.replace(pointFirst,(_m,n,s)=>save(n,s));
 // An elided second “trên”: “Trên AB lấy P tùy ý, CD lần lượt lấy Q tùy ý”.
 if(items.length){const elided=new RegExp(String.raw`${boundary}(${side})\s+${order}(?:lấy|chọn)\s+(?:điểm\s+)?(${point})${free}`,'giu');source=source.replace(elided,(_m,s,n)=>save(n,s));}
 return {text:source,items};
}
