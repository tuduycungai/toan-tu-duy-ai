export function validateTable(data) {
  if (!data || !Array.isArray(data.labels) || !Array.isArray(data.values) || data.labels.length < 2 || data.labels.length > 24 || data.labels.length !== data.values.length) throw Error('Cần từ 2 đến 24 nhóm và đủ giá trị tương ứng.');
  if (data.labels.some(x => typeof x !== 'string' || !x.trim() || x.length > 60) || new Set(data.labels.map(x => x.trim())).size !== data.labels.length) throw Error('Tên nhóm phải rõ ràng và không trùng.');
  const lists=[data.values,...(data.second ? [data.second] : [])];
  if (lists.some(a=>!Array.isArray(a)||a.length!==data.labels.length||a.some(v=>typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>1e12))) throw Error('Mỗi nhóm cần số hữu hạn; không được bỏ trống ô.');
  if (typeof data.unit!=='string'||!data.unit.trim()||data.unit.length>60) throw Error('Hãy ghi đơn vị dữ liệu.');
  if(data.positions && (!Array.isArray(data.positions)||data.positions.length!==data.labels.length||data.positions.some((n,i)=>!Number.isFinite(n)||Math.abs(n)>1e12||(i>0&&n<=data.positions[i-1]))))throw Error('Mốc ngang cần đủ số, theo thứ tự tăng nghiêm ngặt.');
  if (data.percent && lists.some(a=>a.some(v=>v<0)||Math.abs(a.reduce((a,b)=>a+b,0)-100)>0.01)) throw Error('Mỗi dãy phần trăm phải không âm và có tổng bằng 100%; hãy kiểm tra số liệu gốc.');
  const total=data.values.reduce((a,b)=>a+b,0);
  return {...data,total,angles:total>0&&data.values.every(v=>v>=0)?data.values.map(v=>v/total*360):[]};
}
export function chartScale(data) {
  const values=[...data.values,...(data.second||[])];
  const low=Math.min(0,...values), high=Math.max(0,...values);
  const span=high-low || 1, raw=span/4, magnitude=10**Math.floor(Math.log10(raw));
  const step=([1,2,5,10].find(v=>v*magnitude>=raw)||10)*magnitude;
  const min=Math.floor(low/step)*step, max=Math.ceil(high/step)*step || step;
  const ticks=Array.from({length:Math.round((max-min)/step)+1},(_,i)=>Number((min+i*step).toPrecision(10)));
  return {min,max,ticks};
}
