import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';

const [project,out]=process.argv.slice(2);
if(!project||!out)throw Error('Usage: build.mjs PROJECT_DIRECTORY OUTPUT_DIRECTORY');
const evidence=path.join(project,'research/v622-checks');
const data=JSON.parse(await fs.readFile(evidence+'/test-results.json','utf8'));
const observations=JSON.parse(await fs.readFile(evidence+'/live-observations.json','utf8'));
for(const o of observations)o.at=o.evidence?JSON.parse(await fs.readFile(evidence+'/'+o.evidence,'utf8')).at:null;
const {tests:cases,commands,startup}=data,end=cases.length+5;
const wb=Workbook.create(),summary=wb.worksheets.add('Tong_quan'),detail=wb.worksheets.add('Kiem_thu'),live=wb.worksheets.add('Website_thuc_te');
const ink='#20334D',navy='#19375B',muted='#596C7C';
const cell=(sheet,address,value)=>{sheet.getRange(address).values=[[value]];};
function base(sheet,range,widths){
 sheet.showGridLines=false;
 const r=sheet.getRange(range);r.format.font={name:'Arial',size:11,color:ink};r.format.fill='#FFFFFF';r.format.rowHeight=24;r.format.verticalAlignment='center';
 for(const [col,width] of Object.entries(widths))sheet.getRange(col+'1').format.columnWidthPx=width;
}
function header(sheet,range){const r=sheet.getRange(range);r.format.fill=navy;r.format.font={name:'Arial',size:11,bold:true,color:'#FFFFFF'};r.format.rowHeight=30;r.format.horizontalAlignment='center';}
function title(sheet,label,source){cell(sheet,'A2',label);sheet.getRange('A2').format.font={name:'Arial',size:16,bold:true,color:ink};sheet.getRange('A2').format.rowHeight=34;cell(sheet,'A3',source);sheet.getRange('A3').format.font={name:'Arial',size:10,italic:true,color:muted};}
function statusFormat(sheet,range){
 sheet.getRange(range).conditionalFormats.add('containsText',{text:'Lỗi',format:{fill:'#FBE3E3',font:{color:'#9C2020',bold:true}}});
 for(const text of ['Bỏ qua','Chưa','Cần sửa'])sheet.getRange(range).conditionalFormats.add('containsText',{text,format:{fill:'#FFF0CE',font:{color:'#815400'}}});
}

base(summary,'A1:D28',{A:285,B:155,C:160,D:530});summary.tabColor=navy;
title(summary,'Kiểm thử bản cập nhật 6.2.2','Tư duy Toán học. Ngày kiểm thử: 20/09/2026 (UTC).');
summary.getRange('A5:B5').values=[['Kiểm thử mã nguồn','Số ca']];header(summary,'A5:B5');
summary.getRange('A6:A9').values=[['Đạt'],['Bỏ qua'],['Lỗi'],['Tổng số']];
summary.getRange('B6:B9').formulas=[
 [`=COUNTIFS(Kiem_thu!$E$6:$E$${end},"Đạt")`],
 [`=COUNTIFS(Kiem_thu!$E$6:$E$${end},"Bỏ qua")`],
 [`=COUNTIFS(Kiem_thu!$E$6:$E$${end},"Lỗi")`],
 [`=COUNTA(Kiem_thu!$A$6:$A$${end})`],
];
summary.getRange('B6:B9').setNumberFormat('0');summary.getRange('B6:B9').format.horizontalAlignment='right';
summary.getRange('A9:B9').format.font={name:'Arial',size:11,bold:true,color:ink};
cell(summary,'D5','Phân biệt hai nguồn bằng chứng');header(summary,'D5');
summary.getRange('D6:D9').values=[
 ['Kiểm thử tự động: mã nguồn bản 6.2.2, chưa triển khai lên Netlify.'],
 ['Website thật: bản 6.2.1, có các ca nhận phản hồi Gemini bằng mã lớp.'],
 ['18 tệp lõi giữ nguyên mã băm. Có 13 ca kiểm thử mới.'],
 ['1 ca cần khóa Gemini trực tiếp bị bỏ qua trong npm test.'],
];
summary.getRange('D6:D9').format.wrapText=true;summary.getRange('A6:D9').format.rowHeight=37;
summary.getRange('A12:D12').values=[['Lệnh','Kết quả','Thời gian (giây)','Bắt đầu (UTC)']];header(summary,'A12:D12');
summary.getRange('A13:D16').values=[...commands.map(c=>[c.command,c.exit_code===0?'Đạt':'Lỗi',c.duration_ms/1000,new Date(c.started_at_utc)]),['npm start',startup.ready?'Sẵn sàng':'Lỗi',startup.duration_ms/1000,new Date(startup.started_at_utc)]];
summary.getRange('C13:C16').setNumberFormat('0.000');summary.getRange('D13:D16').setNumberFormat('yyyy-mm-dd hh:mm:ss');summary.getRange('A13:D16').format.rowHeight=28;
cell(summary,'A19','Giới hạn và nguồn đối chiếu');summary.getRange('A19').format.font={name:'Arial',size:12,bold:true,color:ink};
for(const [row,value] of [
 [20,'Link poster mới đã sửa trong mã. Cần triển khai toàn bộ bản 6.2.2 để áp dụng lên website.'],
 [21,'Chưa xác nhận tải SVG/TikZ bằng công cụ; chưa thử Safari/iPhone thật hoặc lưu khảo sát thật vào Forms.'],
 [22,'Kết quả Website_thuc_te giữ cả lỗi đã quan sát và các mục chưa kiểm chứng; không gộp vào số ca đạt ở trên.'],
 [23,'Nguồn: research/v622-checks/npm-test.log, commands.json, start-result.json và WEB-*.json trong ZIP.'],
 [24,'Các phản hồi mô phỏng và ví dụ biên soạn trong tests không phải bản ghi Gemini hoặc kết quả của học sinh thật.'],
 [26,'Bản sửa: đổi mức hỗ trợ theo hồ sơ, sửa nhận xét định lí, định dạng chữ và luồng chọn bài trong bộ đề.'],
 [27,'Không thay API, model, mã lớp, cấu hình Netlify hoặc quy trình đồng ý gửi khảo sát.'],
 ]){cell(summary,'A'+row,value);summary.getRange('A'+row).format.font={name:'Arial',size:10,color:muted};}

base(detail,`A1:G${end}`,{A:76,B:660,C:300,D:180,E:100,F:110,G:105});detail.tabColor='#607891';
title(detail,`Kết quả toàn bộ ${cases.length} kiểm thử`,'Nguồn: research/v622-checks/npm-test.log. Giữ nguyên tên ca để đối chiếu tệp nguồn và dòng nhật ký.');
detail.getRange('A5:G5').values=[['Mã','Tên kiểm thử','Tệp kiểm thử','Bắt đầu đợt (UTC)','Kết quả','Thời gian (ms)','Dòng nhật ký']];
detail.getRange(`A6:G${end}`).values=cases.map(c=>[c.id,c.name,c.file,new Date(data.test_run_utc),c.status,c.duration_ms,c.log_line]);
const dt=detail.tables.add(`A5:G${end}`,true,'KiemThuMaNguon');dt.style='TableStyleMedium2';dt.showBandedRows=true;header(detail,'A5:G5');
detail.getRange(`B6:C${end}`).format.wrapText=true;detail.getRange(`D6:D${end}`).setNumberFormat('yyyy-mm-dd hh:mm:ss');detail.getRange(`F6:F${end}`).setNumberFormat('0.000');detail.getRange(`G6:G${end}`).setNumberFormat('0');
cases.forEach((c,i)=>{const lines=c.name.split('\n').reduce((n,line)=>n+Math.max(1,Math.ceil(line.length/82)),0);detail.getRange(`A${i+6}:G${i+6}`).format.rowHeight=Math.max(36,lines*17+8);});
statusFormat(detail,`E6:E${end}`);detail.freezePanes.freezeRows(5);detail.freezePanes.freezeColumns(1);

const last=observations.length+5;
base(live,`A1:I${last}`,{A:76,B:220,C:370,D:320,E:400,F:160,G:390,H:180,I:290});live.tabColor='#6C7F82';
title(live,'Quan sát website thật và việc cần xác nhận','Nguồn: các WEB-*.json trong research/v622-checks. Website https://tuduyhinhtoan8.netlify.app/ chạy bản 6.2.1 khi kiểm tra.');
live.getRange('A5:I5').values=[['Mã','Chức năng','Đầu vào / thao tác','Kết quả mong đợi','Quan sát thực tế','Trạng thái trên site','Bản sửa / giới hạn','Ghi nhận (UTC)','Tệp minh chứng']];
live.getRange(`A6:I${last}`).values=observations.map(o=>[o.id,o.feature,o.input,o.expected,o.observed,o.status,o.change,o.at?new Date(o.at):null,o.evidence||'Chưa thực hiện']);
const lt=live.tables.add(`A5:I${last}`,true,'QuanSatWebsite');lt.style='TableStyleMedium2';lt.showBandedRows=true;header(live,'A5:I5');
live.getRange(`B6:I${last}`).format.wrapText=true;live.getRange(`H6:H${last}`).setNumberFormat('yyyy-mm-dd hh:mm:ss');
observations.forEach((o,i)=>{
 const lines=Math.max(Math.ceil(o.feature.length/25),Math.ceil(o.input.length/45),Math.ceil(o.expected.length/40),Math.ceil(o.observed.length/50),Math.ceil(o.change.length/48),Math.ceil(o.status.length/18));
 live.getRange(`A${i+6}:I${i+6}`).format.rowHeight=Math.max(64,lines*18+12);
});
statusFormat(live,`F6:F${last}`);live.freezePanes.freezeRows(5);live.freezePanes.freezeColumns(2);
wb.recalculate();
const counts=summary.getRange('B6:B9').values.flat();assert.deepEqual(counts,[442,1,0,443]);
// One reversible status edit confirms that summary formulas follow their source.
const original=detail.getRange('E6').values[0][0];detail.getRange('E6').values=[['Lỗi']];
assert.equal(summary.getRange('B8').values[0][0],1);detail.getRange('E6').values=[[original]];wb.recalculate();
assert.deepEqual(summary.getRange('B6:B9').values.flat(),counts);
const inspection=await wb.inspect({kind:'table',range:'Tong_quan!A5:D16',include:'values,formulas',tableMaxRows:12,tableMaxCols:4,maxChars:5000});
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:25},summary:'Formula error scan',maxChars:2000});
await fs.mkdir(out,{recursive:true});
await fs.writeFile(out+'/xlsx-checks.json',JSON.stringify({counts,liveRecords:observations.length,inspection:inspection.ndjson,error_scan:errors.ndjson},null,2));
for(const [sheetName,range,name] of [['Tong_quan','A1:D28','summary'],['Kiem_thu','A1:G16','tests'],['Website_thuc_te','A1:F10','web-left'],['Website_thuc_te','G5:I10','web-right']]){
 const png=await wb.render({sheetName,range,scale:1.2,format:'png'});await fs.writeFile(out+'/'+name+'.png',new Uint8Array(await png.arrayBuffer()));
}
await(await SpreadsheetFile.exportXlsx(wb)).save(out+'/KIEM_THU_V6_2_2.xlsx');
console.log(JSON.stringify({counts,liveRecords:observations.length,path:out+'/KIEM_THU_V6_2_2.xlsx'}));
