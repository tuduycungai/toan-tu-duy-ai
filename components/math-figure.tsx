import {useMemo,useState} from 'react';
import {compileGeometry} from '../lib/geometry-model';
import {readFigure} from '../lib/figure-cache';
import {ProblemFigure as LocalFigure} from './problem-figure';
import {ProblemFigure as AIFigure} from './tikz-figure';

// Use the existing verified coordinate renderer without a model call. Keep the
// problem as the sole source: an answer or an AI reply cannot alter the figure.
export function ProblemFigure(props:React.ComponentProps<typeof AIFigure>){
 const [useAI,setUseAI]=useState(()=>!!readFigure(props.problem));
 const local=useMemo(()=>compileGeometry(props.problem).status==='verified',[props.problem]);
 if(local&&!useAI)return <><p className="figure-caption">Hình dựng trong ứng dụng · không tốn phí API. Hình được giữ khi em trả lời tiếp.</p><LocalFigure key={props.redrawToken} problem={props.problem} level={props.level} onProblemChange={props.onProblemChange}/><button className="text-button" disabled={props.suspended} onClick={()=>setUseAI(true)}>Dựng hình khác bằng AI (cần API)</button></>;
 return <AIFigure {...props}/>;
}
