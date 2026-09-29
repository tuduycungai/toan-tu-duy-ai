from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
root=Path('tests/fixtures/images');root.mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',30)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',24)
def page(lines):
 im=Image.new('RGB',(1500,950),'white');d=ImageDraw.Draw(im)
 for i,line in enumerate(lines): d.text((55,40+55*i),line,font=font,fill='black')
 return im
lines=['Cho tam giác ABC vuông tại A.', 'M thuộc đoạn AB và 2AM = AB.', 'Chứng minh M là trung điểm AB.']
im=page(lines);d=ImageDraw.Draw(im);d.line([(350,730),(1050,730),(350,330),(350,730)],fill='black',width=4)
for name,p in [('A',(350,730)),('B',(1050,730)),('C',(350,330)),('M',(700,730))]:
 d.ellipse((p[0]-5,p[1]-5,p[0]+5,p[1]+5),fill='black');d.text((p[0]-15,p[1]+12 if name!='C' else p[1]-45),name,font=font,fill='black')
d.line([(350,700),(380,700),(380,730)],fill='black',width=3)
im.save(root/'clear-ratio.png');im.save(root/'text-figure.jpg',quality=95);im.save(root/'clear.webp',quality=95)
im.rotate(90,expand=True).save(root/'rotated.png');im.transform(im.size,Image.Transform.AFFINE,(1,.18,-75,.03,1,-10),Image.Resampling.BICUBIC,fillcolor='white').save(root/'skewed.png')
im.filter(ImageFilter.GaussianBlur(7)).crop((160,0,1250,950)).save(root/'blurred-cropped.png')
page(['Cho tam giác ABC. M là trung điểm AB.', 'N là trung điểm AC. Chứng minh MN song song BC.']).save(root/'midpoint.png')
page(['Cho hình chữ nhật ABCD.', 'AB song song CD và AB vuông góc AD.', 'Vẽ hai đường chéo AC, BD cắt nhau tại O.']).save(root/'parallel-perpendicular.png')
page(['Cho đường tròn tâm O bán kính 2 cm.', 'A thuộc đường tròn. Kẻ tiếp tuyến tại A.', 'Vẽ bán kính OA và tiếp tuyến.']).save(root/'circle.png')
page(['Vẽ đồ thị hàm số y = x² trên đoạn [-2; 2].', 'Đánh dấu gốc tọa độ và các trục x, y.']).save(root/'graph.png')
(root/'invalid.txt').write_text('This is not an image. SVG/HTML uploads must be rejected.')
(root/'README.md').write_text('Ảnh kiểm thử tự soạn bằng Pillow. Không phải dữ liệu thực nghiệm của học sinh. Các biến thể nghiêng, xoay, mờ dùng để chạy kiểm thử đầu vào và làm bộ ca gọi Gemini thật khi có khóa. Không coi phản hồi API giả lập là kết quả OCR thật.\n',encoding='utf8')
