import { mobileDevice } from './device-budget';
/** Embed computed SVG styles so downloaded figures remain readable outside the app. */
export function serializeDiagram(svg: SVGSVGElement, caption: string) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const source = [svg, ...svg.querySelectorAll('*')],
    target = [clone, ...clone.querySelectorAll('*')];
  source.forEach((node, i) => {
    const style = getComputedStyle(node);
    for (const key of [
      'fill',
      'stroke',
      'stroke-width',
      'stroke-dasharray',
      'stroke-linecap',
      'stroke-linejoin',
      'font-family',
      'font-size',
      'font-weight',
      'paint-order',
      'text-anchor',
    ])
      target[i].setAttribute(key, style.getPropertyValue(key));
  });
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', '1120');
  clone.setAttribute('height', '810');
  clone.removeAttribute('style');
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', '560');
  bg.setAttribute('height', '405');
  bg.setAttribute('fill', getComputedStyle(svg).backgroundColor || '#ffffff');
  clone.prepend(bg);
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', '14');
  label.setAttribute('y', '395');
  label.setAttribute('font-size', '10');
  label.setAttribute('font-family', 'Arial, sans-serif');
  label.setAttribute('fill', getComputedStyle(svg).color);
  label.textContent = caption;
  clone.append(label);
  return new XMLSerializer().serializeToString(clone);
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function exportPNG(source: string) {
  const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' })),
    canvas = document.createElement('canvas');
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Chưa tạo được ảnh PNG. Em có thể tải SVG.'));
      img.src = url;
    });
    canvas.width = mobileDevice() ? 1280 : 1680;
    canvas.height = Math.round((canvas.width * 1215) / 1680);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw Error('Trình duyệt chưa hỗ trợ xuất ảnh.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight),
      w = img.naturalWidth * scale,
      h = img.naturalHeight * scale;
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Không tạo được PNG.'))),
        'image/png',
      ),
    );
  } finally {
    canvas.width = canvas.height = 1;
    URL.revokeObjectURL(url);
  }
}
