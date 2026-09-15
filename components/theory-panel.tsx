import {BookOpen} from 'lucide-react';
import {theoryForProblem,type TheoryOptions} from '../lib/theory';
export function TheoryPanel({problem,level,model,ai}:{problem:string}&TheoryOptions){
 const items=theoryForProblem(problem,{level,model,ai}),basic=/Mất|nền tảng/.test(level||'');
 const render=(t:typeof items[number],i:number)=><details key={t.id} open={basic&&i===0}><summary>{t.title}{t.needsReview?' · Cần đối chiếu':''}</summary><p>{t.definition}</p><p><strong>Điều kiện áp dụng:</strong> {t.conditions.join(' ')}</p><p><strong>Liên hệ đề bài:</strong> {t.connectionToProblem}</p><p><strong>Dấu hiệu chọn hướng:</strong> {t.signal}</p><p><strong>Dễ nhầm:</strong> {t.commonMistake}</p><p><strong>Thao tác tư duy:</strong> {t.thinkingOperation}</p>{t.example&&<details><summary>Xem ví dụ nhỏ</summary><p>{t.example}</p></details>}<small>{t.source}</small></details>;
 return <section className="theory-panel" aria-label="LÝ THUYẾT DỰ KIẾN DÙNG"><h3><BookOpen size={18}/>LÝ THUYẾT DỰ KIẾN DÙNG</h3><p className="theory-intro">Kiến thức nền và hướng có thể dùng. Em đối chiếu điều kiện trước khi chọn; đây chưa phải lời giải.</p>{(basic?items.slice(0,2):items).map(render)}{basic&&items.length>2&&<details><summary>Xem thêm hướng kiến thức</summary>{items.slice(2).map(render)}</details>}</section>;
}
