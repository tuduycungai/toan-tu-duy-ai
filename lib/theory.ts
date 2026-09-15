export type Theory={id:string;title:string;content:string;condition:string};
export const bank:Record<string,Theory>={
 angles:{id:'angles',title:'Góc trong và góc ngoài',content:'Tổng các góc trong một tứ giác bằng 360°; trong tam giác bằng 180°. Hai góc kề bù có tổng 180°.',condition:'Đọc đúng thứ tự đỉnh và phân biệt góc trong với góc ngoài kề bù.'},
 midpoint:{id:'midpoint',title:'Trung điểm và tỉ lệ đoạn thẳng',content:'Trung điểm nằm trên đoạn thẳng và cách đều hai đầu mút. Hai đoạn nhỏ đều bằng nửa đoạn ban đầu. Hệ số nhân độ dài phải được giữ khi biến đổi đẳng thức.',condition:'Đẳng thức độ dài riêng lẻ chưa xác định được vị trí điểm trên đoạn.'},
 midline:{id:'midline',title:'Đường trung bình của tam giác',content:'Đoạn nối trung điểm hai cạnh của tam giác song song với cạnh thứ ba và dài bằng nửa cạnh ấy. Đường qua trung điểm một cạnh, song song với cạnh thứ hai, đi qua trung điểm cạnh còn lại.',condition:'Xác định đúng tam giác và hai cạnh có trung điểm.'},
 parallel:{id:'parallel',title:'Song song, vuông góc và góc',content:'Hai đường thẳng phân biệt cùng vuông góc với một đường thì song song. Khi một đường cắt hai đường song song, các góc so le trong và đồng vị tương ứng bằng nhau.',condition:'Phải xác định cùng đường thứ ba hoặc đúng cặp góc trước khi áp dụng.'},
 congruence:{id:'congruence',title:'Hai tam giác bằng nhau',content:'Các trường hợp thường dùng: cạnh–cạnh–cạnh, cạnh–góc–cạnh, góc–cạnh–góc. Tam giác vuông còn có trường hợp cạnh huyền–cạnh góc vuông hoặc cạnh huyền–góc nhọn.',condition:'Ghép đúng các đỉnh tương ứng; góc trong cạnh–góc–cạnh phải xen giữa hai cạnh.'},
 parallelogram:{id:'parallelogram',title:'Hình bình hành',content:'Có hai cặp cạnh đối song song; các cạnh đối bằng nhau, các góc đối bằng nhau; đường chéo cắt nhau tại trung điểm mỗi đường. Có thể nhận biết bằng hai cặp cạnh đối song song, hai cặp cạnh đối bằng nhau, hoặc một cặp cạnh đối vừa song song vừa bằng nhau.',condition:'Nhận biết qua đường chéo đòi hỏi giao điểm là trung điểm của cả hai đường.'},
 rectangle:{id:'rectangle',title:'Hình chữ nhật',content:'Có bốn góc vuông. Hình bình hành có một góc vuông hoặc có hai đường chéo bằng nhau là hình chữ nhật.',condition:'Tứ giác chỉ có hai đường chéo bằng nhau chưa đủ để nhận biết hình chữ nhật.'},
 rhombus:{id:'rhombus',title:'Hình thoi',content:'Có bốn cạnh bằng nhau. Hình bình hành có hai cạnh kề bằng nhau hoặc hai đường chéo vuông góc là hình thoi. Đường chéo hình thoi chia đôi các góc ở đỉnh.',condition:'Hình thoi không nhất thiết có hai đường chéo bằng nhau; hình vuông là trường hợp có.'},
 square:{id:'square',title:'Hình vuông',content:'Có bốn góc vuông và bốn cạnh bằng nhau. Có thể nhận biết từ hình chữ nhật có hai cạnh kề bằng nhau hoặc từ hình thoi có một góc vuông.',condition:'Hai đường chéo vừa bằng nhau vừa vuông góc chưa đủ với tứ giác bất kì.'},
 trapezoid:{id:'trapezoid',title:'Hình thang và hình thang cân',content:'Hình thang có một cặp cạnh đối song song. Hình thang cân có hai góc kề một đáy bằng nhau; hai đường chéo bằng nhau. Đoạn nối trung điểm hai cạnh bên song song hai đáy, dài bằng nửa tổng hai đáy.',condition:'Xác định rõ hai đáy, cạnh bên; không nhầm đường trung bình hình thang với của tam giác.'},
 symmetry:{id:'symmetry',title:'Đối xứng qua điểm và qua đường',content:'Đối xứng qua điểm: tâm là trung điểm của đoạn nối hai điểm tương ứng. Đối xứng qua đường: trục là đường trung trực của đoạn nối hai điểm tương ứng.',condition:'Hai phép đối xứng có điều kiện khác nhau; không dùng lẫn tâm và trục.'},
 bisector:{id:'bisector',title:'Tia phân giác',content:'Tia phân giác nằm trong góc và chia góc đó thành hai góc bằng nhau. Điểm trên tia phân giác cách đều hai cạnh của góc.',condition:'Khoảng cách đến cạnh được đo bằng đoạn vuông góc đến đường thẳng chứa cạnh.'},
 pythagoras:{id:'pythagoras',title:'Định lí Pythagore',content:'Trong tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông. Khi dùng định lí đảo, so sánh bình phương cạnh dài nhất với tổng bình phương hai cạnh còn lại.',condition:'Phải xác định góc vuông trước khi áp dụng chiều thuận; thống nhất đơn vị độ dài.'},
 area:{id:'area',title:'Diện tích',content:'Diện tích tam giác bằng nửa tích đáy và chiều cao tương ứng. Diện tích hình chữ nhật bằng tích hai kích thước. Tứ giác có hai đường chéo vuông góc có diện tích bằng nửa tích hai đường chéo.',condition:'Không dùng công thức nửa tích đường chéo nếu chưa có điều kiện vuông góc.'},
 inequality:{id:'inequality',title:'Bất đẳng thức tam giác',content:'Trong một tam giác không suy biến, tổng độ dài hai cạnh lớn hơn cạnh còn lại. Có thể cộng các bất đẳng thức cùng chiều.',condition:'Chọn đúng tam giác và không dùng hình suy biến.'}
};
function selectTheory(problem:string):Theory[]{
 const s=problem.normalize('NFC').toLowerCase().replace(/\\parallel|\/\s*\//g,'∥').replace(/\\perp|⊥/g,'⟂').replace(/\\triangle|[△Δ]/g,'tam giác'),ids:string[]=[];const add=(id:string)=>{if(!ids.includes(id))ids.push(id);};
 if(/trung điểm|trung trực|\d\s*\*?\s*[a-z]{2}\s*=|[a-z]{2}\s*[:/]\s*[a-z]{2}|[a-z]{2}\s*=\s*[a-z]{2}\s*\//.test(s)){add('midpoint');if(!/hình thang/.test(s)&&/tam giác|trung điểm/.test(s))add('midline');}
 if(/vuông góc|⟂|song song|∥|đường cao|hình chiếu/.test(s))add('parallel');
 if(/đối xứng|trung trực/.test(s))add('symmetry');
 if(/phân giác/.test(s))add('bisector');
 if(/hình bình hành/.test(s))add('parallelogram');
 if(/hình chữ nhật/.test(s))add('rectangle');
 if(/hình thoi/.test(s))add('rhombus');
 if(/hình vuông/.test(s))add('square');
 if(/hình thang/.test(s))add('trapezoid');
 if(/tính.*góc|tính x|∠|\d°|góc ngoài|góc chưa biết/.test(s))add('angles');
 if(/diện tích/.test(s))add('area');
 if(/p[yit]+th|cạnh huyền|màn hình/.test(s)||(/tính[^.!?]*(?:độ dài|chu vi|chiều cao|đường chéo|cạnh|cm|dm|mét)/.test(s)&&/vuông|đường cao|đường chéo|tam giác|thang/.test(s)))add('pythagoras');
 if(/chu vi|> p|> ab|> ad|so sánh đường chéo/.test(s)&&!/tính/.test(s))add('inequality');
 if(/chứng minh|tam giác.*cân|bằng nhau/.test(s)&&!ids.includes('inequality')&&!/tính x|tính bốn góc/.test(s))add('congruence');
 if(/đường tròn|tiếp tuyến|dây cung|bán kính/.test(s)){add('circle');if(/tiếp tuyến/.test(s))add('tangent');if(/góc|nội tiếp/.test(s))add('cyclic');}if(/đồng dạng|tỉ số|tỉ lệ|thales|ta lét/.test(s))add('similarity');if(!ids.length)add('reasoning');return ids.map(id=>bank[id]);
}

Object.assign(bank,{
 circle:{id:'circle',title:'Đường tròn, bán kính và dây cung',content:'Đường tròn tâm O bán kính R gồm các điểm cách O một khoảng bằng R. Dây cung nối hai điểm trên đường tròn; đường kính là dây đi qua tâm.',condition:'Kiểm tra hai đầu dây thuộc cùng đường tròn; bán kính có một đầu ở tâm.'},
 tangent:{id:'tangent',title:'Tiếp tuyến và bán kính',content:'Tiếp tuyến tại một điểm của đường tròn vuông góc với bán kính đi qua tiếp điểm. Đảo lại, đường thẳng qua một điểm trên đường tròn và vuông góc bán kính tại đó là tiếp tuyến.',condition:'Tiếp điểm phải nằm trên đường tròn; góc vuông phải đặt đúng tại tiếp điểm.'},
 cyclic:{id:'cyclic',title:'Góc nội tiếp và tứ giác nội tiếp',content:'Góc nội tiếp bằng nửa số đo cung bị chắn. Tứ giác nội tiếp có tổng hai góc đối bằng 180°.',condition:'Đỉnh góc nội tiếp nằm trên đường tròn, hai cạnh chứa dây; xác định đúng cung bị chắn.'},
 similarity:{id:'similarity',title:'Thalès và tam giác đồng dạng',content:'Đường thẳng song song với một cạnh tam giác cắt hai cạnh còn lại tạo các đoạn tương ứng tỉ lệ. Hai tam giác đồng dạng có các góc tương ứng bằng nhau và các cạnh tương ứng tỉ lệ.',condition:'Ghép đúng thứ tự các đỉnh; kiểm tra điều kiện song song hoặc trường hợp đồng dạng trước khi lập tỉ số.'},
 reasoning:{id:'reasoning',title:'Đọc giả thiết và chọn điều kiện đủ',content:'Giả thiết là dữ kiện được cho; kết luận là điều cần chứng minh. Muốn dùng một định lí, cần đối chiếu đủ các điều kiện với giả thiết hoặc kết quả đã chứng minh.',condition:'Không dùng chính kết luận làm giả thiết; không lấy hình minh họa làm bằng chứng.'}
});
export type TheoryUnit=Theory & {definition:string;conditions:string[];connectionToProblem:string;thinkingOperation:string;commonMistake:string;source:string;example:string;signal:string;needsReview?:boolean};
export type TheoryOptions={level?:string;model?:{normalized?:string;relations:{type:string;point?:string;of?:[string,string];role?:string}[];goal:string};ai?:unknown};
const examples:Record<string,string>={midpoint:'Ví dụ khác: M thuộc PQ và PM = MQ = 2 cm thì M là trung điểm PQ.',midline:'Ví dụ khác: Trong tam giác XYZ, U và V là trung điểm XY và XZ; UV song song YZ.',parallelogram:'Ví dụ khác: Nếu hai đường chéo của tứ giác KLMN cùng nhận I làm trung điểm thì KLMN là hình bình hành.',circle:'Ví dụ khác: Nếu OX = R thì X thuộc đường tròn tâm O, bán kính R.',tangent:'Ví dụ khác: X thuộc (O), d đi qua X và d vuông góc OX thì d tiếp xúc (O) tại X.'};
const mistakes:Record<string,string>={midpoint:'Chỉ có hai khoảng cách bằng nhau chưa đủ; điểm còn phải nằm trên đoạn.',midline:'Nhầm đường nối hai điểm bất kỳ với đường trung bình.',parallelogram:'Chỉ chứng minh một đường chéo bị chia đôi đã vội kết luận.',trapezoid:'Nhầm nửa tổng hai đáy với nửa một đáy.',tangent:'Đặt góc vuông ở tâm thay vì tiếp điểm.',congruence:'Ghép sai đỉnh tương ứng hoặc dùng góc không xen giữa hai cạnh.'};
/** Dynamic retrieval + contextual linking; no lookup by exercise ID. Registry is openly extensible. */
export function theoryForProblem(problem:string,options:TheoryOptions={}):TheoryUnit[]{
 const selected=selectTheory(options.model?.normalized||problem),midpoints=options.model?.relations.filter(r=>r.type==='midpoint'&&r.role!=='goal')||[];
 const pointNames=[...problem.matchAll(/([A-Z])\s+(?:là\s+)?trung điểm\s+(?:của\s+)?([A-Z]{2})/g)].map(m=>m[1]+' trên '+m[2]);
 const link=midpoints.map(r=>r.point+' trên '+r.of?.join('')).concat(pointNames).filter((s,i,a)=>a.indexOf(s)===i).join('; ');
 const units=selected.map(t=>({...t,definition:t.content,conditions:[t.condition],connectionToProblem:t.id==='midpoint'&&link?'Đối chiếu định nghĩa tại '+link+'.':t.id==='parallelogram'&&/tâm\s+[A-Z]/u.test(problem)?'Dữ kiện về tâm gợi việc kiểm tra giao điểm và các nửa đường chéo.':t.id==='midline'?'Tìm một tam giác có đủ hai trung điểm; nếu chưa có, kiến thức này chỉ là một hướng cần kiểm tra.':t.id==='parallel'?'Đối chiếu các quan hệ song song, vuông góc trong giả thiết với mục tiêu; xác định đường thứ ba hoặc cặp góc thích hợp.':'Đối chiếu các đối tượng nêu trong đề với điều kiện của '+t.title.toLowerCase()+'.',thinkingOperation:t.id==='reasoning'?'Phân tích':t.id==='congruence'?'So sánh':'Phát hiện quan hệ',commonMistake:mistakes[t.id]||t.condition,source:'Thư viện kiến thức hình học THCS của ứng dụng; điều kiện được kiểm tra trước khi dùng.',example:examples[t.id]||'Hãy thử nêu một trường hợp nhỏ thỏa đủ điều kiện trên rồi kiểm tra lại định nghĩa.',signal:t.id==='midline'?'Hai trung điểm cùng nằm trên hai cạnh của một tam giác.':t.id==='parallelogram'?'Dữ kiện có cặp cạnh đối hoặc trung điểm của hai đường chéo.':'Dữ kiện cung cấp đủ điều kiện của tính chất đang xét.'}));
 // V5.1: never render free-form provider theory: it may contain a complete solution.
 // Extension happens through reviewed registry entries, retrieved for arbitrary new statements.
 if(/Mất|nền tảng/.test(options.level||'')){const priority=['reasoning','midpoint','circle','parallelogram','rectangle','rhombus','square','trapezoid'];const rank=(id:string)=>priority.includes(id)?priority.indexOf(id):99;units.sort((a,b)=>rank(a.id)-rank(b.id));}
 return units;
}
