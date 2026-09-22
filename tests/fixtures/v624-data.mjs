import {readFileSync} from 'node:fs';
export const problem='Ví dụ 2. Cho hình thang ABCD (AB // CD), M là trung điểm của AD, N là trung điểm của BC. Gọi I, K theo thứ tự là giao của MN với BD, AC. Biết AB = 8 cm, CD = 16 cm. Tính độ dài các đoạn MI, IK, KN.';
export const reading={transcription:problem,figureLabels:[],givens:['AB // CD','M là trung điểm của AD','N là trung điểm của BC','AB = 8 cm','CD = 16 cm'],goals:['Tính độ dài các đoạn MI, IK, KN.'],construction:'',points:['A','B','C','D','M','N','I','K'],objects:[{name:'ABCD',type:'polygon',points:['A','B','C','D'],definition:'Hình thang ABCD',source:'hình thang ABCD'}],relations:[
 {kind:'parallel',items:['A','B','C','D'],value:0,description:'AB song song CD',source:'AB // CD'},
 {kind:'midpoint',items:['M','A','D'],value:0,description:'M là trung điểm AD',source:'M là trung điểm của AD'},
 {kind:'midpoint',items:['N','B','C'],value:0,description:'N là trung điểm BC',source:'N là trung điểm của BC'},
 {kind:'intersection',items:['I','M','N','B','D'],value:0,description:'I là giao điểm MN và BD',source:'Gọi I, K theo thứ tự là giao của MN với BD, AC'},
 {kind:'intersection',items:['K','M','N','A','C'],value:0,description:'K là giao điểm MN và AC',source:'Gọi I, K theo thứ tự là giao của MN với BD, AC'},
 {kind:'length',items:['A','B'],value:8,description:'AB = 8 cm',source:'AB = 8 cm'},
 {kind:'length',items:['C','D'],value:16,description:'CD = 16 cm',source:'CD = 16 cm'}],auxiliary:[],highlights:['MI','IK','KN'],uncertainties:[],confidence:.97,theory:[{name:'Đường trung bình của tam giác',conditions:'Đoạn nối trung điểm hai cạnh song song cạnh thứ ba và bằng nửa cạnh ấy.'},{name:'Đường trung bình của hình thang',conditions:'Đoạn nối trung điểm hai cạnh bên song song hai đáy và bằng nửa tổng hai đáy.'}],clarification:''};
export const latex=readFileSync(new URL('./trapezoid-v624.tex',import.meta.url),'utf8');
export function failedStructure(){const bad=structuredClone(reading);bad.objects[0].source='ABCD có hai cạnh đối song song';return bad;}
