import {createServer,preview} from 'vite';import {chromium} from 'playwright';import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';import assert from 'node:assert/strict';
const out='research/v6-checks';mkdirSync(out,{recursive:true});
const production=process.env.TEST_PRODUCTION==='1';const server=production?await preview({preview:{host:'127.0.0.1',port:4177}}):await createServer({server:{host:'127.0.0.1',port:4177}});if(!production)await server.listen();
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];const code=readFileSync('tests/fixtures/right-isosceles.tex','utf8');
const problem='Cho tam giác ABC vuông cân tại C. Trên AC, BC lấy P, Q sao cho AP=CQ. Qua P kẻ PM song song BC, M thuộc AB. Chứng minh PM=CQ và PCQM là hình chữ nhật.';
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));let diagramCalls=0,fail=false,missing=false;
 await page.route('**/api/chat',async route=>{const b=route.request().postDataJSON();let json;if(b.check)json={ok:true};else if(b.mode==='diagram'){diagramCalls++;json=missing?{latex:'',question:'Điểm M nằm trên đường nào, em nhỉ?'}:{latex:fail&&diagramCalls===1?code.replace('\\draw (A)','\\UndefinedCommand (A)'):code,question:''};}else json={text:'[SO_DO]\nDU_KIEN: Tam giác ABC vuông cân tại C; PM song song BC.\nMUC_TIEU: Chứng minh PM=CQ.\nCAU_NOI: Tính chất góc tạo bởi hai đường song song.\nBUOC_TIEP: Đối chiếu hai góc trong tam giác APM.\n[/SO_DO]\nThao tác tư duy: Phân tích — tìm hai góc bằng nhau.\nÀ, mình nhìn tam giác nhỏ APM nhé!\nGợi mở: Nhờ PM song song BC, góc APM bằng góc nào của tam giác ABC?'};await route.fulfill({json});});
 await page.goto('http://127.0.0.1:4177');await page.getByRole('button',{name:'Bắt đầu khám phá',exact:false}).click();
 const input=page.getByLabel('Nhập đề bài hoặc bài làm');await input.fill(problem);await page.getByRole('button',{name:'Gửi',exact:true}).click();await page.getByLabel('Mã truy cập',{exact:true}).fill('HOCGIOITOAN');await page.getByRole('button',{name:'Kiểm tra & kết nối'}).click();
 await page.getByLabel('Họ và tên',{exact:false}).fill('Học sinh thử nghiệm');await page.getByLabel('Trường đang học',{exact:false}).fill('Trường THCS');await page.getByLabel('Email',{exact:false}).fill('test@example.test');await page.getByLabel('Lớp',{exact:true}).fill('8A');await page.getByRole('button',{name:'Hoàn tất thông tin & bắt đầu học'}).click();
 await page.getByRole('button',{name:'Gửi',exact:true}).click();await page.locator('.tikz-result').waitFor({timeout:45000});
 const svg=await page.locator('.tikz-result').getAttribute('src');assert(svg.includes('font%2Fwoff2'));assert(!svg.includes('tikzjax-loader'));results.push('Gemini fixture → real TeX/WASM → SVG with embedded fonts');
 assert.equal(await page.locator('.geometry-assumptions').count(),0);results.push('Removed assumptions panel');
 await page.locator('.current-problem').screenshot({path:out+'/01-hinh-v6.png'});
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Tải PNG',exact:true}).click();await(await download).saveAs(out+'/02-export.png');assert.equal(readFileSync(out+'/02-export.png').toString('hex',0,8),'89504e470d0a1a0a');results.push('PNG export');
 for(const width of [390,768]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}results.push('Mobile 390 and 768 px');
 await page.setViewportSize({width:1440,height:1000});
 fail=true;diagramCalls=0;await page.locator('.problem-figure').getByRole('button',{name:'Vẽ lại hình',exact:true}).click();await page.locator('.tikz-result').waitFor({timeout:70000});assert.equal(diagramCalls,2);results.push('Real compiler failure triggers one AI repair then displays image');
 missing=true;await page.locator('.problem-figure').getByRole('button',{name:'Vẽ lại hình',exact:true}).click();await page.getByText('Điểm M nằm trên đường nào, em nhỉ?',{exact:true}).waitFor();assert.equal(await page.locator('.tikz-result').count(),0);results.push('Missing point location asks one question; no fabricated triangle');
 assert.deepEqual(errors,[]);results.push('No browser JS errors');
 writeFileSync(out+'/results.json',JSON.stringify({status:'pass',ai:'mocked; actual browser compiler and PNG export',results},null,2));console.log(results);
}finally{await browser.close();if(production)await new Promise(r=>server.httpServer.close(r));else await server.close();}
