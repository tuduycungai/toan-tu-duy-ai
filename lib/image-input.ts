import {IMAGE_LIMITS,validateImage} from '../public/image-format.mjs';
export type PreparedImage={data:string;mimeType:string;width:number;height:number;preview:string;name:string;compressed:boolean};
const blobData=(blob:Blob)=>new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(Error('Không đọc được ảnh.'));r.readAsDataURL(blob);});
export async function prepareImage(file:File):Promise<PreparedImage>{
  if(file.size>IMAGE_LIMITS.fileBytes)throw Error('Ảnh vượt quá 24 MB. Hãy chụp riêng phần đề.');
  validateImage(await file.arrayBuffer(),file.type);
  let bitmap:ImageBitmap|HTMLImageElement|undefined;
  let objectURL='';
  try {
    if(typeof createImageBitmap==='function')bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
    else {objectURL=URL.createObjectURL(file);const img=new Image();img.src=objectURL;await img.decode();bitmap=img;}
    const width=bitmap.width,height=bitmap.height;
    if(width*height>IMAGE_LIMITS.pixels)throw Error('Ảnh có quá nhiều điểm ảnh.');
    let scale=Math.min(1,2400/Math.max(width,height));
    const canvas=document.createElement('canvas');let blob:Blob|null=null;
    // Bound all compression attempts. Preserve a readable long edge, then ask for a crop.
    for(let pass=0;pass<3;pass++){
      canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
      const context=canvas.getContext('2d');if(!context)throw Error('Trình duyệt không hỗ trợ xử lý ảnh.');
      context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
      for(const quality of [0.94,0.88,0.82]){blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));if(blob&&blob.size<=IMAGE_LIMITS.uploadBytes)break;}
      if(blob&&blob.size<=IMAGE_LIMITS.uploadBytes)break;
      if(Math.max(canvas.width,canvas.height)<=1700)break;scale*=0.85;
    }
    if(!blob||blob.size>IMAGE_LIMITS.uploadBytes)throw Error('Ảnh vẫn quá lớn để giữ rõ ký hiệu. Hãy cắt riêng phần đề rồi chọn lại.');
    const preview=await blobData(blob);
    return {data:preview.split(',')[1],mimeType:'image/jpeg',width:canvas.width,height:canvas.height,preview,name:file.name.slice(0,120),compressed:scale<1||blob.size<file.size};
  } finally {if(objectURL)URL.revokeObjectURL(objectURL);if(typeof bitmap!=='undefined'&&'close' in bitmap)bitmap.close();}
}
