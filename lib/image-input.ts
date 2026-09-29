import { IMAGE_LIMITS, validateImage } from '../public/image-format.mjs';
import { mobileDevice, mobileImagePixels } from './device-budget';
export type PreparedImage = {
  data: string;
  mimeType: string;
  width: number;
  height: number;
  preview: string;
  name: string;
  compressed: boolean;
};
const blobData = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = () => reject(Error('Không đọc được ảnh.'));
    r.readAsDataURL(blob);
  });
const encode = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
export function releaseImage(image: PreparedImage | null) {
  if (image?.preview.startsWith('blob:')) URL.revokeObjectURL(image.preview);
}
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (file.size > IMAGE_LIMITS.fileBytes)
    throw Error('Ảnh vượt quá 24 MB. Hãy chụp riêng phần đề.');

  const header = validateImage(await file.slice(0, 1024 * 1024).arrayBuffer(), file.type);
  const mobile = mobileDevice();
  if (mobile && header.width * header.height > mobileImagePixels)
    throw Error(
      'Ảnh vượt 16 triệu điểm ảnh cho điện thoại. Em chọn chế độ chụp 12 MP hoặc cắt riêng phần đề để tránh quá tải.',
    );
  let bitmap: ImageBitmap | HTMLImageElement | undefined,
    objectURL = '';
  const canvas = document.createElement('canvas'),
    thumbnail = document.createElement('canvas');
  try {
    const target = Math.min(mobile ? 2200 : 2400, Math.max(header.width, header.height));
    if (typeof createImageBitmap === 'function') {
      const resize =
        header.width >= header.height ? { resizeWidth: target } : { resizeHeight: target };
      bitmap = await createImageBitmap(file, {
        imageOrientation: 'from-image',
        resizeQuality: 'high',
        ...resize,
      });
    } else {
      objectURL = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(Error('Không giải mã được ảnh.'));
        img.src = objectURL;
      });
      bitmap = img;
    }
    const width = bitmap instanceof HTMLImageElement ? bitmap.naturalWidth : bitmap.width,
      height = bitmap instanceof HTMLImageElement ? bitmap.naturalHeight : bitmap.height;
    if (width * height > (mobile ? mobileImagePixels : IMAGE_LIMITS.pixels))
      throw Error('Ảnh có quá nhiều điểm ảnh. Hãy cắt riêng phần đề.');
    let scale = Math.min(1, (mobile ? 2200 : 2400) / Math.max(width, height)),
      blob: Blob | null = null;
    for (let pass = 0; pass < 3; pass++) {
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw Error('Trình duyệt không hỗ trợ xử lý ảnh.');
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.94, 0.88, 0.82]) {
        blob = await encode(canvas, quality);
        if (blob && blob.size <= IMAGE_LIMITS.uploadBytes) break;
      }
      if (blob && blob.size <= IMAGE_LIMITS.uploadBytes) break;
      if (Math.max(canvas.width, canvas.height) <= 1700) break;
      scale *= 0.85;
    }
    if (!blob || blob.size > IMAGE_LIMITS.uploadBytes)
      throw Error('Ảnh vẫn quá lớn để giữ rõ ký hiệu. Hãy cắt riêng phần đề rồi chọn lại.');
    const thumbScale = Math.min(1, 720 / Math.max(canvas.width, canvas.height));
    thumbnail.width = Math.max(1, Math.round(canvas.width * thumbScale));
    thumbnail.height = Math.max(1, Math.round(canvas.height * thumbScale));
    thumbnail.getContext('2d')?.drawImage(canvas, 0, 0, thumbnail.width, thumbnail.height);
    const thumb = await encode(thumbnail, 0.86),
      data = await blobData(blob);
    return {
      data,
      mimeType: 'image/jpeg',
      width: canvas.width,
      height: canvas.height,
      preview: URL.createObjectURL(thumb || blob),
      name: file.name.slice(0, 120),
      compressed:
        header.width > canvas.width || header.height > canvas.height || blob.size < file.size,
    };
  } finally {
    canvas.width = canvas.height = 1;
    thumbnail.width = thumbnail.height = 1;
    if (objectURL) URL.revokeObjectURL(objectURL);
    if (bitmap && 'close' in bitmap) bitmap.close();
    else if (bitmap instanceof HTMLImageElement) bitmap.src = '';
  }
}
