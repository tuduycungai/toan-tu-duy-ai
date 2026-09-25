export function mobileDevice() {
  return (
    typeof navigator !== 'undefined' &&
    (/iPhone|iPad|Android/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
      (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches))
  );
}
export const mobileImagePixels = 16_000_000;
