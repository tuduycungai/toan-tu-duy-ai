/** Deterministic constrained coordinates for non-template numeric problems.
 * The solver's result is always rechecked; convergence alone is not acceptance.
 */
import {parseProblem,problemParts,verifyConstraints,type Constraint,type ParsedProblem} from './problem-diagram';
import {construct,defaults,distance,lerp,dot,cross,sub,norm,intersection,resolveLine,validateShape,type XY,type Recipe,type Drawing,type Segment,type Construction} from './geometry';
export type AngleConstraint={names:string;degrees:number;source:string};
export function angleDegrees(a:XY,o:XY,b:XY){return Math.acos(Math.max(-1,Math.min(1,dot(sub(a,o),sub(b,o))/(distance(a,o)*distance(b,o)))))*180/Math.PI;}
const key=(s:Segment)=>s.slice().sort().join('');
function solveLinear(a:number[][],b:number[]){const n=b.length,m=a.map((r,i)=>[...r,b[i]]);for(let k=0;k<n;k++){let pivot=k;for(let i=k+1;i<n;i++)if(Math.abs(m[i][k])>Math.abs(m[pivot][k]))pivot=i;if(Math.abs(m[pivot][k])<1e-14)throw Error('Hệ tuyến tính suy biến.');[m[k],m[pivot]]=[m[pivot],m[k]];const scale=m[k][k];for(let j=k;j<=n;j++)m[k][j]/=scale;for(let i=0;i<n;i++)if(i!==k){const s=m[i][k];for(let j=k;j<=n;j++)m[i][j]-=s*m[k][j];}}return m.map(r=>r[n]);}
function parameters(kind:string){switch(kind){case'parallelogram':return [6,1.4,3.5];case'rectangle':return [6,3.6];case'square':return [4];case'rhombus':return [5,.927295218];case'trapezoid':case'isosceles-trapezoid':return [6,3.4,1.2,3.6];case'right-triangle':return [5,3.6];case'isosceles-triangle':return [6,4];case'triangle':return [6,2,3.8];default:return [6,5,4,-1,3];}}
function coords(kind:string,x:number[]):XY[]{const[a,b,c,d,e]=x;let q:number[][];
 switch(kind){case'parallelogram':q=[[0,0],[a,0],[a+b,c],[b,c]];break;case'rectangle':q=[[0,0],[a,0],[a,b],[0,b]];break;case'square':q=[[0,0],[a,0],[a,a],[0,a]];break;case'rhombus':q=[[0,0],[a,0],[a+a*Math.cos(b),a*Math.sin(b)],[a*Math.cos(b),a*Math.sin(b)]];break;case'trapezoid':case'isosceles-trapezoid':{const offset=kind==='isosceles-trapezoid'?(a-b)/2:c;q=[[offset,d],[offset+b,d],[a,0],[0,0]];break;}case'right-triangle':q=[[0,0],[a,0],[0,b]];break;case'isosceles-triangle':q=[[0,b],[-a/2,0],[a/2,0]];break;case'triangle':q=[[0,0],[a,0],[b,c]];break;default:q=[[0,0],[a,0],[b,c],[d,e]];}
 return q.map(([x,y])=>({x,y}));}
function evaluate(r:Recipe,x:number[],free:Construction[]){
 const q=coords(r.kind,x),points:Record<string,XY>={};r.vertices.forEach((n,i)=>points[n]=q[i]);const n=parameters(r.kind).length;
 const todo=structuredClone(r.points);for(let pass=0;pass<30&&todo.length;pass++){let made=0;for(let i=0;i<todo.length;){const c=todo[i];try{let v:XY;if(c.op==='intersection')v=intersection(...resolveLine(c.lines[0],points),...resolveLine(c.lines[1],points));else{const a=points[c.of[0]],b=points[c.of[1]];if(!a||!b)throw Error();if(c.op==='midpoint')v=lerp(a,b,.5);else if(c.op==='reflect')v=lerp(a,b,2);else if(c.op==='foot'){const u=sub(b,a);v=lerp(a,b,dot(sub(points[c.from],a),u)/dot(u,u));}else if(c.op==='on')v=lerp(a,b,x[n+free.findIndex(f=>f.name===c.name)]);else v=lerp(a,b,(c.factor??1)*distance(points[c.length[0]],points[c.length[1]])/distance(a,b));}if(!Number.isFinite(v.x+v.y))throw Error();points[c.name]=v;todo.splice(i,1);made++;}catch{i++;}}if(!made)throw Error('Thiếu điểm cho hệ ràng buộc.');}
 return {points,q};
}
export function solveExtended(source:string):{drawing:Drawing;parsed:ParsedProblem;angles:AngleConstraint[]}|null{
 const parts=problemParts(source),angles:AngleConstraint[]=[];let given=parts.given;
 given=given.replace(/(?:∠|góc\s+)([A-Z]{1,3})\s*=\s*(\d+(?:[.,]\d+)?)\s*(?:°|độ)/giu,(clause,n,d)=>{angles.push({names:n.toUpperCase(),degrees:Number(d.replace(',','.')),source:clause});return ' ';});
 const parsed=parseProblem(given+' '+parts.full.slice(parts.given.length));if(!parsed||parsed.remainder)return null;const r=structuredClone(parsed.recipe),v=r.vertices;
 for(const a of angles)if(a.names.length===1){const i=v.indexOf(a.names);if(i<0)throw Error('Đỉnh góc chưa có.');a.names=v[(i+v.length-1)%v.length]+v[i]+v[(i+1)%v.length];}
 if(angles.some(a=>a.names.length!==3||a.degrees<=0||a.degrees>=180))throw Error('Góc phải thuộc (0°,180°).');
 const free=r.points.filter(c=>c.op==='on'),start=parameters(r.kind),initial=[...start,...free.map(c=>c.op==='on'?c.ratio:.37)];
 const residual=(x:number[])=>{const {points:p}=evaluate(r,x,free),len=(s:Segment)=>distance(p[s[0]],p[s[1]]),out:number[]=[];
  for(const c of parsed.constraints)switch(c.type){
   case'length':out.push((len(c.of)-c.value)/Math.max(c.value,1));break;case'equal':out.push((len(c.a)-len(c.b))/Math.max(len(c.a),len(c.b),1));break;case'ratio':out.push((len(c.a)-c.factor*len(c.b))/Math.max(len(c.a),c.factor*len(c.b),1));break;
   case'parallel':case'perpendicular':{const a=sub(p[c.a[1]],p[c.a[0]]),b=sub(p[c.b[1]],p[c.b[0]]);out.push((c.type==='parallel'?cross(a,b):dot(a,b))/Math.max(norm(a)*norm(b),1e-12));break;}
   case'less':out.push(Math.max(0,len(c.a)-len(c.b)+.01));break;
  }
  for(const a of angles)out.push((angleDegrees(p[a.names[0]],p[a.names[1]],p[a.names[2]])-a.degrees)/90);
  if(!out.every(Number.isFinite))throw Error('Hệ ràng buộc suy biến.');return out;
 };
 let x=initial.slice(),lambda=.001,f=residual(x),cost=f.reduce((s,n)=>s+n*n,0);
 if(!f.length)return null;
 for(let iteration=0;iteration<120&&cost>1e-20;iteration++){
  const j=x.map((value,i)=>{const y=x.slice(),delta=1e-5*Math.max(1,Math.abs(value));y[i]+=delta;const fy=residual(y);return fy.map((v,k)=>(v-f[k])/delta);});
  const a=x.map((_,i)=>x.map((_,k)=>j[i].reduce((s,v,t)=>s+v*j[k][t],0)+(i===k?lambda:0))),b=x.map((_,i)=>-j[i].reduce((s,v,t)=>s+v*f[t],0));
  const delta=solveLinear(a,b);let accepted=false;
  for(const step of [1,.5,.2,.05])try{const y=x.map((n,i)=>n+step*delta[i]);if(free.some((_,i)=>y[start.length+i]<=.005||y[start.length+i]>=.995))continue;const {q}=evaluate(r,y,free);validateShape(r.kind,q);const fy=residual(y),next=fy.reduce((s,n)=>s+n*n,0);if(next<cost){x=y;f=fy;cost=next;accepted=true;lambda=Math.max(1e-10,lambda*.4);break;}}catch{}
  if(!accepted)lambda*=10;if(lambda>1e10)break;
 }
 if(cost>1e-15)throw Error('Chưa tìm được cấu hình thỏa đồng thời các ràng buộc.');
 r.coords=coords(r.kind,x);for(const c of r.points)if(c.op==='on')c.ratio=x[start.length+free.findIndex(f=>f.name===c.name)];
 for(const c of parsed.constraints){if('a'in c)r.segments.push(c.a,c.b);if(c.type==='midpoint'){r.segments.push(c.of);r.marks.push({type:'equal',segments:[[c.of[0],c.point],[c.point,c.of[1]]]});}}
 const drawing=construct(r);drawing.checks=verifyConstraints(drawing,parsed.constraints);
 for(const a of angles){const p=drawing.points;if(Math.abs(angleDegrees(p[a.names[0]],p[a.names[1]],p[a.names[2]])-a.degrees)>1e-6)throw Error('Góc chưa thỏa dữ kiện.');drawing.checks.push('∠'+a.names+' = '+a.degrees+'°');}
 drawing.checks.unshift('Loại hình và tọa độ đã được kiểm tra');return {drawing,parsed,angles};
}
