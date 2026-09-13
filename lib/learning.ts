import {parseDiagram,stripDiagram} from './diagram';
export type Plan={given:string;goal:string;bridge:string;next:string};
export type Point={name:string;x:number;y:number};
export type Figure={points:Point[];outline:string[];lines:[string,string][]};
export type Lesson={id:string;title:string;topic:string;level:string;operation:string;minutes:number;problem:string;plan:Plan;figure:Figure;hint:string;solution:string;transfer:string};
export const learningModes=[
 {id:'guide',api:'guide',title:'Gợi mở từng bước',desc:'Tự tìm đường đến lời giải',icon:'light'},
 {id:'review',api:'review',title:'Kiểm tra lời giải',desc:'Hiểu lỗi sai, sửa có căn cứ',icon:'check'},
 {id:'compare',api:'compare',title:'So sánh cách giải',desc:'Một bài toán, nhiều góc nhìn',icon:'compare'},
 {id:'practice',api:'guide',title:'Luyện tập mỗi ngày',desc:'Vận dụng và kết nối kiến thức',icon:'pen'},
 {id:'test',api:'guide',title:'Tự kiểm tra',desc:'Tự làm trước, nhận xét sau',icon:'target'}
];
export const defaultPlan:Plan={given:'Tách điều đề bài cho biết khỏi điều quan sát trên hình.',goal:'Xác định chính xác kết luận cần chứng minh.',bridge:'Tìm dấu hiệu nhận biết hoặc định lí đủ điều kiện áp dụng.',next:'Chọn một quan hệ nhỏ để chứng minh trước.'};
export const lessons:Lesson[]=[
 {id:'midpoints',title:'Bốn trung điểm — một cấu trúc ẩn',topic:'Hình bình hành',level:'Vận dụng',operation:'Phân tích · Khái quát hóa',minutes:12,
 problem:'Cho tứ giác lồi ABCD. E, F, G, H lần lượt là trung điểm của AB, BC, CD, DA. a) Chứng minh EFGH là hình bình hành. b) Tìm điều kiện của hai đường chéo AC, BD để EFGH là hình chữ nhật; là hình thoi.',
 plan:{given:'E, F, G, H là trung điểm bốn cạnh của tứ giác lồi ABCD.',goal:'Chứng minh EFGH là hình bình hành rồi xét các trường hợp đặc biệt.',bridge:'Có thể nối các đỉnh để tạo tam giác chứa hai trung điểm không?',next:'Nối AC. Em nhận ra EF và HG là đường gì trong hai tam giác?'},
 figure:{points:[{name:'A',x:70,y:45},{name:'B',x:265,y:65},{name:'C',x:225,y:190},{name:'D',x:40,y:160},{name:'E',x:167.5,y:55},{name:'F',x:245,y:127.5},{name:'G',x:132.5,y:175},{name:'H',x:55,y:102.5}],outline:['A','B','C','D'],lines:[['A','C'],['B','D'],['E','F'],['F','G'],['G','H'],['H','E']]},
 hint:'Nối AC và BD. Dùng định lí đường trung bình trong từng tam giác.',solution:'EF ∥ AC, HG ∥ AC và EF = HG = AC/2. Vậy EFGH là hình bình hành. Tương tự EH ∥ BD, EH = BD/2. EFGH là hình chữ nhật khi và chỉ khi AC ⟂ BD; là hình thoi khi và chỉ khi AC = BD (tứ giác lồi, không suy biến).',transfer:'Nếu ABCD là hình chữ nhật, EFGH là hình gì? Điều kiện nào để EFGH là hình vuông?'},
 {id:'reflection',title:'Từ tam giác vuông đến hình chữ nhật',topic:'Hình chữ nhật',level:'Vận dụng',operation:'Tổng hợp · Đặc biệt hóa',minutes:10,
 problem:'Cho tam giác ABC vuông tại A, M là trung điểm của BC. Lấy D đối xứng với A qua M. a) Chứng minh tứ giác ABDC là hình chữ nhật. b) Tam giác ABC cần thêm điều kiện gì để ABDC là hình vuông?',
 plan:{given:'∠BAC = 90°; M là trung điểm BC và AD.',goal:'Nhận biết tứ giác ABDC; tìm điều kiện để là hình vuông.',bridge:'Xem BC và AD có vai trò gì trong tứ giác ABDC.',next:'Hai đường chéo của ABDC có chung tính chất nào tại M?'},
 figure:{points:[{name:'A',x:65,y:185},{name:'B',x:65,y:50},{name:'C',x:270,y:185},{name:'D',x:270,y:50},{name:'M',x:167.5,y:117.5}],outline:['A','B','D','C'],lines:[['A','D'],['B','C']]},
 hint:'Chú ý thứ tự các đỉnh ABDC: BC và AD là hai đường chéo.',solution:'MB = MC và MA = MD nên ABDC là hình bình hành. Góc BAC là góc giữa hai cạnh AB, AC của hình bình hành và bằng 90°, do đó ABDC là hình chữ nhật. Hình này là hình vuông khi và chỉ khi AB = AC, tức tam giác ABC vuông cân tại A.',transfer:'Nếu ABC không vuông, cách dựng trên còn tạo được hình bình hành không?'},
 {id:'concurrency',title:'Ba đường thẳng gặp nhau ở đâu?',topic:'Hình bình hành',level:'Vận dụng',operation:'Phân tích · Tổng hợp',minutes:12,
 problem:'Cho hình bình hành ABCD. E, F lần lượt là trung điểm của AB và CD. a) Chứng minh AECF là hình bình hành. b) Chứng minh ba đường thẳng AC, BD và EF đồng quy.',
 plan:{given:'ABCD là hình bình hành; E, F là trung điểm AB, CD.',goal:'Chứng minh AECF là hình bình hành; AC, BD, EF đồng quy.',bridge:'Có thể dùng một cặp cạnh đối vừa song song vừa bằng nhau.',next:'Hãy so sánh AE và CF, đồng thời nêu quan hệ giữa chúng.'},
 figure:{points:[{name:'A',x:85,y:50},{name:'B',x:275,y:50},{name:'C',x:225,y:185},{name:'D',x:35,y:185},{name:'E',x:180,y:50},{name:'F',x:130,y:185},{name:'O',x:155,y:117.5}],outline:['A','B','C','D'],lines:[['A','C'],['B','D'],['E','F'],['E','C'],['F','A']]},
 hint:'Gọi O là trung điểm AC. Hai hình bình hành có chung đường chéo AC sẽ cho em điều gì?',solution:'AE = AB/2 = CD/2 = CF và AE ∥ CF, nên AECF là hình bình hành. Gọi O = AC ∩ BD; O là trung điểm AC. Trong hình bình hành AECF, EF cũng đi qua trung điểm AC. Do đó AC, BD, EF đồng quy tại O.',transfer:'Nếu E ∈ AB, F ∈ CD thỏa AE = CF nhưng không là trung điểm, kết luận đồng quy có còn đúng?'},
 {id:'trapezoid',title:'Hai phần thừa dưới một hình thang cân',topic:'Hình thang cân',level:'Vận dụng',operation:'So sánh · Phân tích',minutes:10,
 problem:'Cho hình thang cân ABCD có AB ∥ CD và AB < CD. Kẻ AE ⟂ CD, BF ⟂ CD (E, F ∈ CD). a) Chứng minh DE = CF. b) Biết AB = 8 cm, CD = 14 cm, tính DE và CF.',
 plan:{given:'ABCD là hình thang cân; AB ∥ CD; AE, BF ⟂ CD.',goal:'Chứng minh DE = CF rồi tính độ dài.',bridge:'Tìm hai tam giác vuông có các yếu tố tương ứng bằng nhau.',next:'Tứ giác ABFE là hình gì? Từ đó hãy so sánh AE với BF.'},
 figure:{points:[{name:'A',x:100,y:55},{name:'B',x:220,y:55},{name:'C',x:275,y:185},{name:'D',x:45,y:185},{name:'E',x:100,y:185},{name:'F',x:220,y:185}],outline:['A','B','C','D'],lines:[['A','E'],['B','F']]},
 hint:'ABFE là hình chữ nhật. Xét hai tam giác vuông ADE và BCF.',solution:'ABFE là hình chữ nhật nên AE = BF, EF = AB. Hai tam giác vuông ADE và BCF có AD = BC (hai cạnh bên hình thang cân) và AE = BF, nên bằng nhau theo cạnh huyền–cạnh góc vuông. Suy ra DE = CF. CD = DE + EF + FC = 2DE + AB nên DE = CF = (14 − 8)/2 = 3 cm.',transfer:'Nếu giữ AB ∥ CD nhưng bỏ giả thiết hình thang cân, bước nào không còn được bảo đảm?'},
 {id:'square',title:'Hai điểm di chuyển, một khoảng cách bằng nhau',topic:'Hình vuông',level:'Vận dụng cao',operation:'So sánh · Tương tự hóa',minutes:15,
 problem:'Cho hình vuông ABCD. E nằm trong cạnh AB, F nằm trong cạnh AD sao cho AE = AF. a) Chứng minh CE = CF. b) Gọi G = AC ∩ EF. Chứng minh AC ⟂ EF.',
 plan:{given:'ABCD là hình vuông; E ∈ AB, F ∈ AD; 0 < AE = AF < AB.',goal:'Chứng minh CE = CF và AC ⟂ EF.',bridge:'Đường chéo AC có tính chất gì với góc BAD?',next:'Hãy so sánh hai tam giác CAE và CAF.'},
 figure:{points:[{name:'A',x:80,y:45},{name:'B',x:240,y:45},{name:'C',x:240,y:205},{name:'D',x:80,y:205},{name:'E',x:175,y:45},{name:'F',x:80,y:140},{name:'G',x:127.5,y:92.5}],outline:['A','B','C','D'],lines:[['A','C'],['E','F'],['C','E'],['C','F']]},
 hint:'AC là phân giác góc BAD. Sau khi so sánh CAE và CAF, xét tiếp AGE và AGF.',solution:'AC là phân giác góc BAD nên ∠EAC = ∠CAF. Hai tam giác CAE và CAF bằng nhau theo cạnh–góc–cạnh, suy ra CE = CF. Với G = AC ∩ EF, hai tam giác AGE và AGF bằng nhau theo cạnh–góc–cạnh. Suy ra ∠AGE = ∠AGF. Hai góc kề bù này cùng bằng 90°, nên AC ⟂ EF.',transfer:'Nếu ABCD chỉ là hình thoi, hai kết luận có còn đúng với cách chọn E, F tương tự không? Hãy kiểm tra bằng tính chất đường chéo.'},
 {id:'counterexample',title:'Đường chéo đẹp — kết luận đã chắc?',topic:'Hình thoi',level:'Vận dụng',operation:'Phản ví dụ · Điều kiện đủ',minutes:12,
 problem:'Một bạn khẳng định: “Tứ giác có hai đường chéo bằng nhau và vuông góc với nhau là hình vuông.” a) Hãy kiểm tra khẳng định bằng một phản ví dụ. b) Nếu bổ sung hai đường chéo cắt nhau tại trung điểm mỗi đường, khẳng định có đúng không? Giải thích.',
 plan:{given:'Hai đường chéo bằng nhau, vuông góc; chưa có giả thiết trung điểm.',goal:'Kiểm tra khẳng định và tìm điều kiện đủ.',bridge:'Một hình vuông còn đòi hỏi tính chất gì ở giao điểm đường chéo?',next:'Thử cho giao điểm chia một đường chéo thành hai đoạn không bằng nhau.'},
 figure:{points:[{name:'A',x:160,y:25},{name:'B',x:260,y:175},{name:'C',x:160,y:225},{name:'D',x:60,y:175},{name:'O',x:160,y:175}],outline:['A','B','C','D'],lines:[['A','C'],['B','D']]},
 hint:'Dựng AC = BD = 4 cm, AC ⟂ BD tại O; OA = 3 cm, OC = 1 cm, OB = OD = 2 cm.',solution:'Cách dựng trong gợi ý cho tứ giác lồi có AC = BD = 4 cm và AC ⟂ BD nhưng OA ≠ OC, nên không là hình bình hành, do đó không là hình vuông. Khi bổ sung hai đường chéo cắt nhau tại trung điểm mỗi đường, tứ giác là hình bình hành; đường chéo bằng nhau cho hình chữ nhật, vuông góc cho hình thoi, nên là hình vuông.',transfer:'Chỉ bổ sung giao điểm là trung điểm một đường chéo có đủ không? Phản ví dụ vừa dựng đã trả lời điều gì?'}
];
export function parseTutorResponse(raw:string){
 const block=raw.match(/\[SO_DO\]([\s\S]*?)\[\/SO_DO\]/);
 let plan:Plan|null=null;
 if(block){const field=(label:string)=>block[1].match(new RegExp('^'+label+':\\s*(.+)$','m'))?.[1].trim().slice(0,300)||'';const p={given:field('DU_KIEN'),goal:field('MUC_TIEU'),bridge:field('CAU_NOI'),next:field('BUOC_TIEP')};if(Object.values(p).every(Boolean))plan=p;}
 const complete=/\[KET_THUC_BUOI_HOC\]\s*$/.test(raw.trim());
 const text=stripDiagram(raw).replace(/\[SO_DO\][\s\S]*?(?:\[\/SO_DO\]|$)/g,'').replace(/\[KET_THUC_BUOI_HOC\]/g,'').trim();
 return {text:text||'Em hãy gửi thêm dữ kiện để Thầy cùng kiểm tra bài toán.',plan,complete,...parseDiagram(raw)};
}
