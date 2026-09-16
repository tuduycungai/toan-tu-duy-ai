import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {ProblemFigure} from '../components/tikz-figure';import '../app/globals.css';import '../app/enhancements.css';
import code from '../tests/fixtures/right-isosceles.tex?raw';
let count=0,scenario='ok';const originalFetch=window.fetch.bind(window);
window.fetch=async(input,init)=>{
 if(String(input)!=='/api/chat')return originalFetch(input,init);
 count++;document.querySelector('#calls')!.textContent=String(count);await new Promise(r=>setTimeout(r,80));
 if(scenario==='invalid-api'&&count===1)return Response.json({error:'Invalid diagram',repairable:true,detail:'Đặt kiểu nét trong tikzpicture.'},{status:502});
 if(scenario==='empty'&&count===1)return Response.json({});
 if(scenario==='malformed')return Response.json({latex:code.replace('\\draw (A)','\\UndefinedDrawingCommand (A)'),question:''});
 if(scenario==='repair-tex'&&count===1)return Response.json({latex:code.replace('\\draw (A)','\\UndefinedDrawingCommand (A)'),question:''});
 return Response.json({latex:code,question:''});
};
const problem='Cho tam giác ABC vuông cân tại C. P, Q thuộc AC, BC, AP=CQ. Qua P kẻ PM song song BC, M thuộc AB. Chứng minh PCQM là hình chữ nhật.';
function App(){const [version,setVersion]=useState(0),[redraw,setRedraw]=useState(0),[connected,setConnected]=useState(false);
 function run(s:string){scenario=s;count=0;document.querySelector('#calls')!.textContent='0';setConnected(true);setVersion(v=>v+1);setRedraw(v=>v+1);}
 return <main style={{maxWidth:900,margin:'20px auto'}}><h1>Kiểm tra bộ vẽ V6.1</h1><p>API giả lập; bộ biên dịch TikZ thật.</p><p>Lượt gọi API: <output id="calls">0</output></p><div style={{display:'flex',gap:10,flexWrap:'wrap'}}>{['ok','invalid-api','empty','repair-tex','malformed'].map(s=><button key={s} onClick={()=>run(s)}>Thử {s}</button>)}<button onClick={()=>setRedraw(v=>v+1)}>Vẽ lại từ hội thoại</button></div><ProblemFigure key={version} redrawToken={redraw} problem={problem} accessCode={connected?'fixture-only':''} onConnect={()=>run('ok')}/></main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
