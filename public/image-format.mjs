export const IMAGE_LIMITS = {
  fileBytes: 24 * 1024 * 1024,
  uploadBytes: 2500000,
  pixels: 60000000,
  edge: 20000,
  minEdge: 64,
};
export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export function imageHeader(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes),
    d = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const ascii = (i, n) => String.fromCharCode(...b.slice(i, i + n));
  if (b.length >= 24 && b[0] === 137 && ascii(1, 7) === 'PNG\r\n\x1a\n' && ascii(12, 4) === 'IHDR')
    return { mimeType: 'image/png', width: d.getUint32(16), height: d.getUint32(20) };
  if (b.length >= 12 && b[0] === 255 && b[1] === 216) {
    let i = 2;
    while (i + 4 < b.length) {
      if (b[i++] !== 255) break;
      let marker = b[i++];
      while (marker === 255) marker = b[i++];
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      const size = d.getUint16(i);
      if (size < 2 || i + size > b.length) break;
      if (
        [192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker) &&
        size >= 7
      )
        return { mimeType: 'image/jpeg', height: d.getUint16(i + 3), width: d.getUint16(i + 5) };
      i += size;
    }
  }
  if (b.length >= 30 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
    const kind = ascii(12, 4);
    if (kind === 'VP8X')
      return {
        mimeType: 'image/webp',
        width: 1 + b[24] + (b[25] << 8) + (b[26] << 16),
        height: 1 + b[27] + (b[28] << 8) + (b[29] << 16),
      };
    if (kind === 'VP8 ' && b[23] === 157 && b[24] === 1 && b[25] === 42)
      return {
        mimeType: 'image/webp',
        width: d.getUint16(26, true) & 16383,
        height: d.getUint16(28, true) & 16383,
      };
    if (kind === 'VP8L' && b[20] === 47) {
      const v = d.getUint32(21, true);
      return { mimeType: 'image/webp', width: (v & 16383) + 1, height: ((v >>> 14) & 16383) + 1 };
    }
  }
  throw Error('Tệp không phải ảnh PNG, JPG/JPEG hoặc WebP hợp lệ.');
}
export function validateImage(bytes, declaredType, maxBytes = IMAGE_LIMITS.fileBytes) {
  if (!IMAGE_TYPES.includes(declaredType))
    throw Error('Chỉ hỗ trợ PNG, JPG/JPEG và WebP. Với HEIC, hãy xuất ảnh JPEG.');
  if (!bytes.byteLength || bytes.byteLength > maxBytes)
    throw Error('Ảnh quá lớn. Hãy chọn ảnh nhỏ hơn 24 MB hoặc chụp riêng phần đề.');
  const header = imageHeader(bytes);
  if (header.mimeType !== declaredType) throw Error('Nội dung tệp không khớp định dạng ảnh.');
  const { width: w, height: h } = header;
  if (
    w < IMAGE_LIMITS.minEdge ||
    h < IMAGE_LIMITS.minEdge ||
    w > IMAGE_LIMITS.edge ||
    h > IMAGE_LIMITS.edge ||
    w * h > IMAGE_LIMITS.pixels
  )
    throw Error('Kích thước ảnh không phù hợp (tối thiểu 64 px, tối đa 60 triệu điểm ảnh).');
  return header;
}
