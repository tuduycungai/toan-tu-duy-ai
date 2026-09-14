export type Theory={id:string;title:string;content:string;condition:string};
const bank:Record<string,Theory>={
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
export function theoryForProblem(problem:string):Theory[]{
 const s=problem.normalize('NFC').toLowerCase(),ids:string[]=[];const add=(id:string)=>{if(!ids.includes(id))ids.push(id);};
 if(/trung điểm|trung trực|\d\s*\*?\s*[a-z]{2}\s*=|[a-z]{2}\s*[:/]\s*[a-z]{2}|[a-z]{2}\s*=\s*[a-z]{2}\s*\//.test(s)){add('midpoint');if(/tam giác|trung điểm/.test(s))add('midline');}
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
 if(!ids.length)add('angles');return ids.map(id=>bank[id]);
}
