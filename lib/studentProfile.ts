
export type StudentProfile={
 name:string; grade:string; school:string; subject:string; level:string;
 weakness:string; goal:string;
};
export const defaultProfile:StudentProfile={
 name:"",grade:"",school:"",subject:"Toán",level:"Cơ bản",weakness:"",goal:""
};
export function profilePrompt(p:StudentProfile){
 return `HỒ SƠ HỌC SINH:
Tên: ${p.name||"chưa cung cấp"}
Lớp: ${p.grade||"chưa cung cấp"}
Trình độ: ${p.level}
Khó khăn: ${p.weakness||"chưa xác định"}
Mục tiêu: ${p.goal||"chưa xác định"}
Hãy cá nhân hóa cách hướng dẫn phù hợp với hồ sơ trên.`;
}
