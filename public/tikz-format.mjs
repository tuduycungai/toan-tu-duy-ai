/** One parser shared by the server and the browser compiler. No TeX is executed here. */
export function stripComments(source){return source.replace(/(?<!\\)%[^\r\n]*/g,'');}
export function prepareTikz(source){
 if(typeof source!=='string'||source.length>18000)throw Error('Mã hình thiếu hoặc quá dài.');
 const clean=stripComments(source).replace(/\\(begin|end)\s*\{\s*tikzpicture\s*\}/g,'\\$1{tikzpicture}');
 if(clean.includes('^^')||/\\(?:input|include|write\d*|openout|read|catcode|csname|special|href|url|immediate|loop|repeat|def|edef|gdef|xdef|let|futurelet|expandafter|scantokens)\b/i.test(clean))throw Error('Mã hình có lệnh không hỗ trợ; hãy dùng tọa độ hoặc pgfmathsetmacro.');
 const bodies=[...clean.matchAll(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g)];
 if(bodies.length!==1)throw Error('Cần đúng một môi trường tikzpicture hoàn chỉnh.');
 const body=bodies[0][0];
 const libraries=[...clean.matchAll(/\\usetikzlibrary\s*\{([^}]+)\}/g)].flatMap(m=>m[1].split(',').map(s=>s.trim()));
 // Defaults cover common model omissions. Never allow paths or URLs as libraries.
 const defaults=['calc','angles','quotes','intersections','through','positioning','3d','arrows.meta'];
 if(libraries.some(s=>!s||!/^[a-zA-Z0-9.-]+$/.test(s)))throw Error('Tên thư viện TikZ không hợp lệ.');
 const before=clean.slice(0,bodies[0].index).replace(/\\documentclass(?:\[[^\]]*\])?\s*\{[^}]+\}|\\usepackage(?:\[[^\]]*\])?\s*\{[^}]+\}|\\usetikzlibrary\s*\{[^}]+\}|\\begin\{document\}/g,'').trim();
 if(before)throw Error('Đặt khai báo tọa độ, màu và kiểu nét bên trong tikzpicture.');
 return {body,libraries:[...new Set([...defaults,...libraries])].join(',')};
}
export function parseDiagramValue(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Phản hồi hình không phải đối tượng JSON.');
 if(typeof value.question==='string'&&value.question.trim()&&!value.latex)return {latex:'',question:value.question.trim().slice(0,500)};
 prepareTikz(value.latex);
 return {latex:value.latex,question:''};
}
export function parseDiagramText(text){
 if(typeof text!=='string')throw Error('Thiếu phản hồi hình.');
 let value;try{value=JSON.parse(text.trim().replace(/^```(?:json)?\s*|\s*```$/g,''));}catch{throw Error('Phản hồi hình chưa đúng định dạng JSON.');}
 return parseDiagramValue(value);
}
