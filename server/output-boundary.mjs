/** V5.1: whitelist presentation. No free-form provider explanation/solution reaches the student.
 * The model evaluates evidence; the UI-facing utterance is assembled from reviewed one-task prompts.
 */
import {adaptiveContext} from './adaptive-protocol.mjs';
import {studentRequest,asksForAnswer} from './strict-tutor.mjs';
import practiceBank from './practice-bank.json' with {type:'json'};
const textRequest=m=>studentRequest([m]).normalize('NFC').replace(/\\parallel|\/\s*\//g,'∥').replace(/\\perp|⊥/g,'⟂').trim();
const stableName=s=>/^[A-Z]{1,4}$/.test(s||'')?s:'';
function problemContext(messages){const candidates=messages.filter(m=>m.role==='user').map(textRequest),selection=candidates.at(-1)?.match(/^(?:em chọn\s+)?(?:câu|bài)\s+(\d+)\s*[.!]?$/iu),list=messages.filter(m=>m.role==='assistant').findLast(m=>/^Câu 1:/mu.test(m.content))?.content||'',selected=selection?list.match(new RegExp('^Câu '+selection[1]+': ([\\s\\S]*?)(?=\\nCâu \\d+:|\\nGợi mở:|$)','m'))?.[1]?.trim():'';
 const problem=selected||candidates.findLast(s=>/(?:Cho|hình|tam giác|tứ giác|đường tròn)/iu.test(s)&&/(?:chứng minh|cmr|tính)/iu.test(s))||candidates[0]||'';
 const shape=problem.match(/(?:hình (bình hành|chữ nhật|thoi|vuông|thang cân|thang)|tứ giác|tam giác)\s+([A-Z]{3,4})/iu),mid=problem.match(/([A-Z])\s+(?:là\s+)?trung điểm\s+(?:của\s+)?([A-Z]{2})/u),center=problem.match(/tâm\s+([A-Z])/u);
 const goal=problem.split(/chứng minh(?: rằng)?|cmr|tính/iu)[1]||'',rel=goal.match(/([A-Z]{2})\s*(∥|⟂|=|song song|vuông góc)\s*([A-Z]{2})/u),poly=goal.match(/([A-Z]{3,4})\s+là\s+hình\s+(bình hành|chữ nhật|thoi|vuông|thang cân|thang)/u);
 return {shape:shape?shape[0]:'hình trong đề',vertices:stableName(shape?.[2]),mid:mid?{point:mid[1],of:mid[2]}:null,center:stableName(center?.[1]),goal:rel?'Chứng minh '+rel[1]+' '+rel[2]+' '+rel[3]:poly?'Chứng minh '+poly[1]+' là hình '+poly[2]:'Xác định kết luận cần chứng minh của bài.',problem};
}
const cards={
 identify:{op:'Phân tích',q:'Đề bài cho biết hình gì, và cụm từ nào giúp em nhận diện hình đó?',objective:'Nhận diện hình từ dữ kiện',action:'Nêu loại hình và căn cứ trong đề'},
 target:{op:'Phân tích',q:'Em hãy nêu kết luận cần chứng minh bằng lời của mình?',objective:'Tách kết luận khỏi giả thiết',action:'Diễn đạt kết luận'},
 definition:{op:'Cụ thể hóa',q:'Một điểm phải thỏa những điều kiện nào để là trung điểm của một đoạn thẳng?',objective:'Hiểu đủ điều kiện của định nghĩa',action:'Nêu vị trí và quan hệ độ dài'},
 circleDefinition:{op:'Cụ thể hóa',q:'Một điểm thuộc đường tròn tâm O, bán kính R thì khoảng cách từ điểm đó đến tâm thỏa điều kiện gì?',objective:'Hiểu định nghĩa đường tròn',action:'Nêu quan hệ khoảng cách đến tâm'},
 strategy:{op:'Phát hiện quan hệ',q:'Em chọn dấu hiệu nào để tiếp cận mục tiêu hiện tại, dựa vào dữ kiện nào trong đề?',objective:'Tự chọn một điều kiện đủ',action:'Đề xuất một dấu hiệu có căn cứ'},
 repair:{op:'Kiểm tra và phản biện lập luận',q:'Điều kiện nào trong bước em vừa viết còn cần kiểm tra lại với giả thiết?',objective:'Kiểm tra mắt xích chưa chắc chắn',action:'Đối chiếu một điều kiện với giả thiết'},
 explain:{op:'Chứng minh và giải thích',q:'Em có thể giải thích lại căn cứ của bước vừa làm bằng lời của mình?',objective:'Tự giải thích kết luận đã nêu',action:'Giải thích một bước, không chỉ nêu kết quả'},
 compare:{op:'So sánh',q:'Khi đối chiếu hai hướng em đã đề xuất, hướng nào cần ít điều kiện phụ hơn?',objective:'So sánh điều kiện của hai hướng',action:'So sánh theo một tiêu chí'},
 generalize:{op:'Khái quát hóa',q:'Nếu thay trung điểm bằng các điểm chia đoạn theo cùng một tỉ số, em dự đoán quan hệ nào còn được giữ?',objective:'Hình thành phỏng đoán có điều kiện',action:'Nêu một phỏng đoán và phạm vi của nó'},
 synthesize:{op:'Tổng hợp',q:'Em sẽ đặt kết quả nào đã có trước để bước tiếp theo có đủ căn cứ?',objective:'Sắp xếp quan hệ đã chứng minh',action:'Chọn thứ tự một mắt xích'},
 condition:{op:'Trừu tượng hóa',q:'Trong bước đang xét, dữ kiện nào là thiết yếu để áp dụng tính chất em chọn?',objective:'Phân biệt điều kiện thiết yếu',action:'Chỉ ra một dữ kiện thiết yếu'}
};
export function controlledTutorOutput(messages,learning){
 const denied=asksForAnswer(messages),similar=/bài tương tự/iu.test(studentRequest(messages)),requested=studentRequest(messages).match(/(?:tạo|sinh)\s+(?:đúng\s+)?(5|6|7|8|9|10)\s+câu/iu);
 if(!denied&&(requested||similar)){
  const request=studentRequest(messages)+(similar?' '+problemContext(messages).problem:''),topic=['Hình thang cân','Hình bình hành','Hình chữ nhật','Hình thoi','Hình vuông'].find(t=>request.toLocaleLowerCase('vi').includes(t.toLocaleLowerCase('vi')))||'';
  const count=similar?1:Number(requested[1]),previousProblem=problemContext(messages).problem,candidates=practiceBank.filter(p=>(!topic||p.topic===topic||p.problem.toLocaleLowerCase('vi').includes(topic.toLocaleLowerCase('vi')))&&(!similar||p.problem!==previousProblem)&&!/(Quan sát|hình vẽ|hình sau|hình dưới|các hình)/iu.test(p.problem));
  const selected=candidates.slice(0,count);while(selected.length<count){const p=candidates[selected.length%candidates.length]||practiceBank[selected.length];selected.push({...p,problem:p.problem.replace(/(?<![\p{L}])[A-Z]{1,4}(?![\p{L}])/gu,s=>s.replace(/[ABCD]/g,n=>({A:'K',B:'L',C:'M',D:'N'})[n]))});}
  const q='Em muốn bắt đầu với bài số mấy?';
  return {text:'[SO_DO]\nDU_KIEN: Chọn một đề và đọc các quan hệ được cho.\nMUC_TIEU: Tự giải một bài trong bộ luyện tập.\nCAU_NOI: Chỉ xem lý thuyết khi đã xác định bài đang học.\nBUOC_TIEP: Chọn số câu để bắt đầu.\n[/SO_DO]\nThao tác tư duy: Phân tích — chọn một nhiệm vụ học tập.\n'+selected.map((p,i)=>'Câu '+(i+1)+': '+p.problem).join('\n')+'\nGợi mở: '+q,learning:{version:5,assessment:null,question:{question:q,thinkingOperation:'Phân tích',learningObjective:'Chọn bài để tự làm',evidence:'Chưa có bài làm',supportLevel:1,expectedStudentAction:'Chọn một số câu',nextStep:'Đọc giả thiết bài được chọn',hintPolicy:'không đưa đáp án trực tiếp'},theory:[]},outputPolicy:'reviewed-exercises-no-solutions-v5.1'};
 }
 const p=adaptiveContext(messages)||{},c=problemContext(messages),turns=messages.filter(m=>m.role==='assistant').length,basic=/Mất|nền tảng/.test(p.level||''),answer=studentRequest(messages),e=learning?.assessment;
 const assessed=e&&typeof e.quote==='string'&&answer.includes(e.quote)&&e.verdict!=='unassessed'&&turns>0;
 let key=basic?(turns===0?'identify':turns===1?'target':turns===2?'definition':'strategy'):'strategy';
 if(key==='definition'&&!/trung điểm/iu.test(c.problem))key=/đường tròn/iu.test(c.problem)?'circleDefinition':'target';
 if(assessed)key=e.verdict==='incorrect'||e.verdict==='partial'?'repair':turns%2?'explain':'synthesize';
 if(!basic&&turns>3&&e?.verdict==='correct'){if(learning?.question?.thinkingOperation==='Khái quát hóa'&&/đã hoàn thành|tự kiểm tra|chuyển giao/iu.test(answer))key='generalize';else if(/hai (?:cách|hướng)/iu.test(answer))key='compare';else if(turns%3===0)key='condition';}
 let card={...cards[key]};if(basic&&turns===1&&c.mid)card={op:'Phân tích',q:`Theo giả thiết, điểm ${c.mid.point} nằm trên đoạn nào?`,objective:'Đọc vị trí điểm',action:'Chỉ đúng đoạn chứa điểm'};
 if(!basic&&turns===0&&c.center&&c.vertices.length===4&&/bình hành|chữ nhật|thoi|vuông/iu.test(c.shape))card={op:'Phát hiện quan hệ',q:`Tính chất đường chéo của hình đã cho giúp em nhận ra quan hệ nào tại ${c.center}?`,objective:'Kết nối tâm với các đường chéo',action:'Nêu một quan hệ có căn cứ'};
 if(!basic&&turns===0&&p.level==='Khá')card={op:'Suy luận',q:'Em có thể đề xuất một chuỗi điều kiện đủ dẫn tới mục tiêu, bắt đầu từ dữ kiện nào?',objective:'Tự đề xuất chiến lược có căn cứ',action:'Đề xuất một hướng và chỉ căn cứ khởi đầu'};
 if(!basic&&turns===0&&/Giỏi|năng khiếu/.test(p.level||''))card={op:'Hình thành giả thuyết',q:'Quan hệ nào em dự đoán là then chốt để tự xây dựng một hướng chứng minh, và em sẽ kiểm tra nó thế nào?',objective:'Đề xuất và kiểm tra một giả thuyết',action:'Nêu một giả thuyết cùng cách kiểm tra'};
 if(denied)card={...cards.target};
 const question={question:card.q,thinkingOperation:card.op,learningObjective:card.objective,evidence:assessed?e.quote.slice(0,250):'Chưa đủ minh chứng để đánh giá',supportLevel:basic?Math.max(3,Math.min(5,Number(p.supportLevel)||3)):Math.max(1,Math.min(5,Number(p.supportLevel)||1)),expectedStudentAction:card.action,nextStep:'Kiểm tra điều kiện học sinh tự nêu trước khi chuyển bước',hintPolicy:'không đưa đáp án trực tiếp'};
 const error=assessed&&(e.verdict==='incorrect'||e.verdict==='partial')?'Cần kiểm tra lại điều kiện áp dụng hoặc bổ sung căn cứ cho bước vừa viết.':'';
 const assessment=e?{quote:typeof e.quote==='string'&&answer.includes(e.quote)?e.quote.slice(0,280):'',verdict:assessed?e.verdict:'unassessed',competency:e.competency,thinkingOperation:e.thinkingOperation,error}:null;
 const text=`[SO_DO]\nDU_KIEN: ${c.vertices?'Đối chiếu giả thiết của '+c.shape+'.':'Đọc các đối tượng và quan hệ trong đề; không suy thêm từ hình.'}\nMUC_TIEU: ${c.goal}\nCAU_NOI: Chọn định nghĩa hoặc tính chất có đủ điều kiện; xem mục lý thuyết dự kiến dùng.\nBUOC_TIEP: ${card.action}.\n[/SO_DO]\nThao tác tư duy: ${card.op} — ${card.objective.toLocaleLowerCase('vi')}.\n${denied?'Thầy không cung cấp đáp án hoặc lời giải hoàn chỉnh. Mình tiếp tục một nhiệm vụ nhỏ để em tự làm.\n':''}${error?error+'\n':''}Gợi mở: ${card.q}`;
 return {text,learning:{version:5,assessment,question,theory:[]},outputPolicy:'one-reviewed-task-v5.1'};
}
