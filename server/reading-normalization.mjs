/** Normalize notation and JSON representation only; never infer a new geometric fact. */
export function mathText(value=''){
  return String(value).normalize('NFC')
    .replace(/\\(?:mathrm|mathbf|mathit|text|overline|overrightarrow)\s*\{([^{}]*)\}/g,'$1')
    .replace(/\\(?:left|right)\b/g,'').replace(/\\(?:parallel|Vert)\b|\/\//g,'∥')
    .replace(/\\perp\b/g,'⟂').replace(/\\(?:in)\b/g,'∈')
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g,'$1/$2')
    .replace(/\\prime\b|′/g,"'").replace(/([A-Z])_\{?(\d{1,2})\}?/g,'$1$2')
    .replace(/\\[()[\],;! ]|\$|[{}]/g,'').replace(/\s+/g,'').trim();
}
export const containsSource=(text,source)=>typeof source==='string'&&!!mathText(source)&&mathText(text).includes(mathText(source));
const point=s=>typeof s==='string'?mathText(s):s;
const defaults=['figureLabels','givens','goals','points','objects','relations','auxiliary','highlights','uncertainties','theory'];
const kinds={parallel_lines:'parallel',perpendicular_lines:'perpendicular',segment_ratio:'ratio',segment_length:'length',lies_on_segment:'on_segment',lies_on_line:'on_line',equal_segments:'equal_length'};
const arity={on_line:3,on_segment:3,between:3,intersection:5,parallel:4,perpendicular:4,equal_length:4,ratio:4,length:2,angle:3,equal_angle:6,midpoint:3,centroid:4,circle_center:1,on_circle:2,tangent:3,bisector:4};
export function normalizeReading(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return value;
  const d=structuredClone(value);
  // Server-only readiness flags may not be supplied by the model.
  delete d.ready;delete d.structureStatus;delete d.structureIssue;
  for(const key of defaults)if(d[key]===undefined||d[key]===null)d[key]=[];
  d.construction??='';d.clarification??='';
  if(Array.isArray(d.points))d.points=[...new Set(d.points.map(point))];
  const split=s=>{
    if(typeof s!=='string')return [s];const name=point(s);
    if(d.points.includes(name))return [name];
    // A segment may be represented as "AD"; accept only one unambiguous split into known points.
    const pairs=d.points.flatMap(a=>d.points.filter(b=>a+b===name).map(b=>[a,b]));
    return pairs.length===1?pairs[0]:[name];
  };
  if(Array.isArray(d.objects))d.objects=d.objects.map(o=>{
    if(!o||typeof o!=='object')return o;
    const type=({triangle:'polygon',quadrilateral:'polygon',trapezoid:'polygon',graph:'function'})[o.type]||o.type;
    return {...o,type,definition:o.definition??'',points:Array.isArray(o.points)?o.points.map(point):o.points};
  });
  if(Array.isArray(d.relations))d.relations=d.relations.map(r=>{
    if(!r||typeof r!=='object')return r;
    const kind=kinds[r.kind]||r.kind;
    let items=Array.isArray(r.items)?r.items.map(point):r.items,value=r.value;
    if(Array.isArray(items)&&items.length!==arity[kind]){
      const expanded=items.flatMap(split);if(expanded.length===arity[kind])items=expanded;
    }
    if(value===undefined||value===null){if(!['ratio','length','angle'].includes(kind))value=0;}
    if(typeof value==='string'&&/^[+-]?\d+(?:[.,]\d+)?(?:\/\d+(?:[.,]\d+)?)?$/.test(value.trim())){
      const [a,b='1']=value.trim().replaceAll(',','.').split('/');value=Number(a)/Number(b);
    }
    return {...r,kind,items,value};
  });
  return d;
}
export function explicitGoals(transcription){
  // Copy a stated task, do not manufacture a missing conclusion.
  const m=transcription.match(/(?:^|[.!?\n]\s*)((?:Hãy\s+)?(?:Chứng minh|Tính|Xác định|Tìm|Dựng|Vẽ)(?=\s|:|$)[^]+)$/iu);
  return m?[m[1].trim().slice(0,600)]:[];
}
