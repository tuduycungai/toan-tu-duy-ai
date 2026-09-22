import {stripComments} from '../public/tikz-format.mjs';
import {coordinateMap} from './tikz-coordinates.mjs';
const number=s=>{const parts=s.trim().replace(/^\{(.*)\}$/,'$1').split('/');if(parts.length>2||parts.some(x=>!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(x.trim())))return NaN;return Number(parts[0])/(parts.length===2?Number(parts[1]):1);};
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1],cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const len=(a,b)=>Math.hypot(...sub(a,b));
const near=(a,b)=>Math.abs(a-b)<1e-5*Math.max(1,Math.abs(a),Math.abs(b));
const onLine=(p,a,b)=>len(a,b)>1e-7&&near(cross(sub(p,a),sub(b,a)),0);
const onSegment=(p,a,b)=>onLine(p,a,b)&&dot(sub(p,a),sub(p,b))<=1e-5;
const angle=(a,o,b)=>Math.acos(Math.max(-1,Math.min(1,dot(sub(a,o),sub(b,o))/(len(a,o)*len(b,o)))))*180/Math.PI;
export function checkGeometryCode(latex,reading){
  const clean=stripComments(latex),points=coordinateMap(stripComments(latex)),checked=[],unverified=[];
  if(/\\begin\s*\{scope\}|(?:xscale|yscale|xshift|yshift|shift|cm|transform canvas)\s*=|[\[,\s](?:x|y)\s*=/i.test(clean))throw Error('Không biến đổi riêng tọa độ đã kiểm tra. Dùng một hệ trục và scale đồng đều.');
  const circles=new Map();
  for(const m of clean.matchAll(/\(([A-Z](?:[0-9]{1,2}|['′]{1,2})?)\)\s+circle\s*\(([^()]+)\)/g)){const radius=number(m[2]);if(Number.isFinite(radius)&&radius>0)circles.set(m[1],radius);}
  const coordinateNames=[...clean.matchAll(/\\coordinate\s*\(([^)]+)\)/g)].map(m=>m[1]);
  if(new Set(coordinateNames).size!==coordinateNames.length)throw Error('Không định nghĩa lại điểm sau khi đã kiểm tra.');
  for(const name of reading.points)if(!points.has(name))throw Error('Điểm '+name+' cần tọa độ số hoặc phép dựng calc/giao điểm được hỗ trợ để đối chiếu.');
  const same=(a,b)=>len(a,b)<1e-7;
  for(const r of reading.relations){
    const ps=r.items.map(n=>points.get(n));if(ps.some(p=>!p))throw Error('Thiếu tọa độ cho '+r.description);
    const [a,b,c,d,e,f]=ps;let ok;
    switch(r.kind){
      case 'on_line':ok=onLine(a,b,c);break;
      case 'on_segment':ok=onSegment(a,b,c);break;
      case 'between':ok=onSegment(b,a,c)&&!same(a,b)&&!same(b,c);break;
      case 'midpoint':ok=onSegment(a,b,c)&&near(len(a,b),len(a,c));break;
      case 'intersection':ok=onLine(a,b,c)&&onLine(a,d,e)&&!near(cross(sub(c,b),sub(e,d)),0);break;
      case 'parallel':ok=len(a,b)>1e-7&&len(c,d)>1e-7&&near(cross(sub(b,a),sub(d,c)),0);break;
      case 'perpendicular':ok=len(a,b)>1e-7&&len(c,d)>1e-7&&near(dot(sub(b,a),sub(d,c)),0);break;
      case 'equal_length':ok=len(a,b)>1e-7&&near(len(a,b),len(c,d));break;
      case 'ratio':ok=len(c,d)>1e-7&&near(len(a,b),r.value*len(c,d));break;
      case 'length':ok=r.value>0&&near(len(a,b),r.value);break;
      case 'angle':ok=near(angle(a,b,c),r.value);break;
      case 'equal_angle':ok=near(angle(a,b,c),angle(d,e,f));break;
      case 'on_circle':if(!circles.has(r.items[1])){unverified.push(r.description);continue;}ok=near(len(a,b),circles.get(r.items[1]));break;
      case 'tangent':if(!circles.has(r.items[0])){unverified.push(r.description);continue;}ok=near(len(a,b),circles.get(r.items[0]))&&len(b,c)>1e-7&&near(dot(sub(a,b),sub(c,b)),0);break;
      case 'bisector':ok=near(angle(a,b,c),angle(c,b,d));break;
      case 'circle_center':if(!circles.has(r.items[0])){unverified.push(r.description);continue;}ok=true;break;
      case 'centroid':ok=near(a[0],(b[0]+c[0]+d[0])/3)&&near(a[1],(b[1]+c[1]+d[1])/3);break;
      default:unverified.push(r.description);continue;
    }
    if(!ok)throw Error('Tọa độ chưa thỏa giả thiết: '+r.description);
    checked.push(r.description);
  }
  for(const o of reading.objects.filter(o=>o.type==='circle')){
    const center=o.points[0],radius=o.source.match(/bán kính\s*(?:(?:R|[A-Z]{2})\s*=\s*)?(\d+(?:[.,]\d+)?)/iu);
    if(radius&&circles.has(center)){if(!near(Number(radius[1].replace(',','.')),circles.get(center)))throw Error('Bán kính đường tròn không đúng giả thiết.');checked.push(o.source);}else if(!circles.has(center))unverified.push(o.definition);
  }
  for(const o of reading.objects.filter(o=>o.type==='polygon')){
    const ps=o.points.map(n=>points.get(n));if(ps.some(p=>!p))throw Error('Đa giác thiếu điểm.');
    if(ps.length<3)continue;
    const area=ps.reduce((sum,p,i)=>sum+cross(p,ps[(i+1)%ps.length]),0);
    if(near(area,0)||ps.some((p,i)=>same(p,ps[(i+1)%ps.length])))throw Error('Đa giác suy biến.');
    if(ps.length!==4)continue;
    const [a,b,c,d]=ps,v=sub(b,a),w=sub(d,a),shape=['hình bình hành','hình chữ nhật','hình thoi','hình vuông'].find(k=>reading.transcription.toLowerCase().replace(/\s+/g,' ').includes(k+' '+o.name.toLowerCase()))||o.source.match(/hình bình hành|hình chữ nhật|hình thoi|hình vuông/iu)?.[0];
    if(!shape)continue;
    const opposite=near(cross(v,sub(c,d)),0)&&near(cross(w,sub(c,b)),0);
    if(!opposite||(/chữ nhật|vuông/iu.test(shape)&&!near(dot(v,w),0))||(/thoi|vuông/iu.test(shape)&&!near(len(a,b),len(a,d))))throw Error('Tọa độ chưa thỏa loại '+shape+' trong đề.');
    checked.push(shape+' '+o.name);
  }
  // The coordinates are checked, not a formal verification of arbitrary drawing paths.
  return {checked,unverified,notice:unverified.length?'Một số quan hệ cần em đối chiếu thêm với đề.':'Đã đối chiếu các quan hệ số trong cấu trúc. Em vẫn cần kiểm tra hình và nhãn.'};
}
