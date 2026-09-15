// Offline visual fixtures; NOT an alternative API or a bypass of class authentication.
import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
import App from '../app/page';import {MathText} from '../components/math-text';import {ProblemFigure,DiagramSVG} from '../components/problem-figure';import {worksheets,worksheetDrawings} from '../lib/worksheets';
import '../app/globals.css';import '../app/enhancements.css';
const mobile=String.raw`Vì $AB = CD$ và $E, F$ là trung điểm nên $AE = EB = \frac{AB}{2}$ và $CF = FD = \frac{CD}{2}$.



Thao tác tư duy: So sánh — đối chiếu các đoạn bằng nhau dựa trên giả thiết.

Gợi mở: Giả thiết trung điểm giúp em liên hệ độ dài AE và CF như thế nào?`;
function Preview(){const [text,setText]=useState(mobile),[problem,setProblem]=useState('Cho hình bình hành ABCD. M thuộc AB, 2AM=AB. Chứng minh CM=DM.'),[theme,setTheme]=useState('light');
return <div className={theme==='dark'?'dark':''} style={{background:'var(--bg)',color:'var(--ink)',padding:16,minHeight:'100vh'}}><h1 style={{fontSize:22}}>Kiểm tra hiển thị V4.4</h1><p>Mẫu kiểm thử cục bộ, không gọi Gemini hoặc gửi Google Forms.</p><button onClick={()=>setTheme(theme==='light'?'dark':'light')}>Đổi sáng / tối</button><a href="#app" onClick={()=>location.reload()}>Mở giao diện ứng dụng</a><section style={{maxWidth:780,margin:'20px auto'}}><label>Nội dung công thức<textarea style={{width:'100%',fontSize:16}} rows={4} value={text} onChange={e=>setText(e.target.value)}/></label><article className="message assistant"><div className="message-body"><div className="message-content" data-testid="math-preview"><MathText text={text}/></div></div></article><label>Đề hình kiểm thử<textarea style={{width:'100%',fontSize:16}} rows={3} value={problem} onChange={e=>setProblem(e.target.value)}/></label><ProblemFigure problem={problem}/><form className="composer" onSubmit={e=>e.preventDefault()}><textarea aria-label="Ô nhập trên điện thoại" placeholder="Nhập bước em đang làm…"/><div className="composer-bottom"><span>0/6000</span><button>Gửi</button></div></form></section><h2>81 bài · 93 hình từ phiếu bài tập</h2><p>Giả thiết đã được viết thành câu chữ; các nét vẽ không thay thế chứng minh.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,420px),1fr))',gap:20}}>{worksheets.flatMap(w=>worksheetDrawings(w).map((d,i)=><article key={w.id+'-'+i} className="worksheet-card"><h3>{w.id} · {d.title}</h3><p>{w.problem}</p><DiagramSVG drawing={d} aux={true}/><details><summary>Quan hệ đã kiểm tra ({d.checks.length})</summary><ul>{d.checks.map((s,n)=><li key={n}>{s}</li>)}</ul></details></article>))}</div></div>}
createRoot(document.getElementById('root')!).render(location.hash==='#app'?<App/>:<Preview/>);
