export const problem='Cho tam giác ABC vuông tại A. M thuộc đoạn AB và 2AM = AB. Chứng minh M là trung điểm AB.';
export const reading={transcription:problem,figureLabels:['A','B','C','M'],givens:['Tam giác ABC vuông tại A','M thuộc đoạn AB','2AM = AB'],goals:['Chứng minh M là trung điểm AB'],construction:'Vẽ tam giác và điểm M',points:['A','B','C','M'],
 objects:[{name:'ABC',type:'polygon',points:['A','B','C'],definition:'Tam giác vuông tại A',source:'tam giác ABC vuông tại A'}],
 relations:[{kind:'perpendicular',items:['A','B','A','C'],value:0,description:'AB vuông góc AC',source:'tam giác ABC vuông tại A'},{kind:'on_segment',items:['M','A','B'],value:0,description:'M thuộc đoạn AB',source:'M thuộc đoạn AB'},{kind:'ratio',items:['A','M','A','B'],value:.5,description:'2AM = AB',source:'2AM = AB'}],
 auxiliary:[],highlights:['M'],uncertainties:[],confidence:.96,theory:[{name:'Định nghĩa trung điểm',conditions:'Điểm thuộc đoạn và cách đều hai đầu mút.'}],clarification:''};
export const latex=String.raw`\documentclass[tikz,border=5mm]{standalone}
\usetikzlibrary{calc,angles,quotes,intersections,through,positioning,3d,arrows.meta}
\begin{document}\begin{tikzpicture}[thick]
\coordinate (A) at (0,0);\coordinate (B) at (6,0);\coordinate (C) at (0,4);\coordinate (M) at (3,0);
\draw (A)--(B)--(C)--cycle;
\pic[draw,angle radius=0.3cm]{right angle=B--A--C};
\draw (1.5,-.1)--(1.5,.1) (4.5,-.1)--(4.5,.1);
\fill (A) circle (1.5pt) (B) circle (1.5pt) (C) circle (1.5pt) (M) circle (1.5pt);
\node[below left] at (A) {$A$};\node[below right] at (B) {$B$};\node[above left] at (C) {$C$};\node[below] at (M) {$M$};
\end{tikzpicture}\end{document}`;
export function assessment(patch={}){return {classification:'correct_complete',stage:6,feedback:'Em đã chỉ ra đúng điều kiện cần kiểm tra.',question:'Từ vị trí M trên đoạn AB, em diễn đạt điều kiện còn lại như thế nào?',operation:'Phân tích',goal:'Chứng minh M là trung điểm AB',bridge:'Định nghĩa trung điểm: vị trí trên đoạn và hai độ dài bằng nhau.',givens:'M thuộc đoạn AB; 2AM = AB.',path:'Dùng định nghĩa trung điểm',goals:['Chứng minh M là trung điểm AB'],coveredGoals:[],retractClaims:[],accepted:[],error:'',proofComplete:false,selfCheckPassed:false,summary:'',abilityEvidence:'Có nêu điều kiện về vị trí.',...patch};}
export const provider=value=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:typeof value==='string'?value:JSON.stringify(value)}]}}]});
