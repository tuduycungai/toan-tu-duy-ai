export const IMAGE_LIMITS: {
  fileBytes: number;
  uploadBytes: number;
  pixels: number;
  edge: number;
  minEdge: number;
};
export const IMAGE_TYPES: string[];
export function imageHeader(bytes: Uint8Array | ArrayBuffer): {
  mimeType: string;
  width: number;
  height: number;
};
export function validateImage(
  bytes: Uint8Array | ArrayBuffer,
  declaredType: string,
  maxBytes?: number,
): ReturnType<typeof imageHeader>;
