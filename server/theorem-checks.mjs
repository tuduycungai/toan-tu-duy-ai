const plain = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();

export function correctTheoremBridge(text) {
  return text.replace(/^CAU_NOI:[^\n]*/gmu, (line) => {
    const s = plain(line);
    const refersToRule =
      s.includes('dau hieu') && s.includes('hinh chu nhat') && s.includes('hinh binh hanh');
    const universal = /\b(?:moi|tat ca|deu)\b/.test(s);
    const required = /\b(?:can|phai|yeu cau|bat buoc)\b/.test(s);
    const rejectsUniversal =
      /khong (?:phai|nhat thiet)|khong the (?:noi|khang dinh)|khong dung|sai khi/.test(s);
    if (!refersToRule || !universal || !required || rejectsUniversal) return line;
    return 'CAU_NOI: Dấu hiệu dùng hai đường chéo bằng nhau áp dụng cho hình bình hành; không phải mọi dấu hiệu nhận biết hình chữ nhật đều có tiền đề đó.';
  });
}
