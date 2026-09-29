function doPost(e) {
  const output = value => ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
  let lock;
  try {
    if (!e || !e.postData || e.postData.contents.length > 90000) throw new Error('Payload quá lớn.');
    const envelope = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('GATEWAY_SECRET') || '';
    if (secret.length < 32 || !Number.isFinite(envelope.timestamp) || Math.abs(Date.now() - envelope.timestamp) > 300000 ||
        typeof envelope.payload !== 'string' || typeof envelope.nonce !== 'string' || typeof envelope.signature !== 'string') throw new Error('Chữ ký không hợp lệ.');
    const expected = Utilities.computeHmacSha256Signature(envelope.timestamp + '.' + envelope.nonce + '.' + envelope.payload, secret)
      .map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
    let difference = expected.length ^ envelope.signature.length;
    for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ (envelope.signature.charCodeAt(i) || 0);
    if (difference) throw new Error('Chữ ký không hợp lệ.');
    const call = JSON.parse(envelope.payload);
    lock = LockService.getScriptLock();
    if (!lock.tryLock(8000)) return output({ ok: false, status: 503, error: 'Đang lưu lượt khác; hãy thử lại.' });
    const db = sheetDatabase_();
    const data = runOperation(db, call.op, call.args || {});
    db.commit();
    return output({ ok: true, data, nonce: envelope.nonce });
  } catch (error) {
    return output({ ok: false, status: error.status || 503, error: error.status ? error.message : 'Google Sheets chưa sẵn sàng. Giáo viên kiểm tra cấu hình, quyền và hạn mức.' });
  } finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}
function headers_(name) {
  return ['id', 'studentId', 'sessionId', 'updatedAt', 'status', 'data', ...(name === 'Turns' ? ['problemId', 'stage', 'question', 'answer', 'verdict', 'errorKind', 'hintLevel', 'nextAction', 'ruleVersion', 'exampleVersion', 'nextQuestion', 'evidence', 'redacted'] : [])];
}
function sheetDatabase_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Thiếu SPREADSHEET_ID.');
  const book = SpreadsheetApp.openById(id), pending = new Map(), locations = new Map(), nextRows = new Map();
  function sheet(name) { if (!TABLES.includes(name)) throw new Error('Bảng không hợp lệ.'); const s = book.getSheetByName(name); if (!s) throw new Error('Chạy setup trước.'); return s; }
  const key = (name, id) => name + ':' + id;
  function find(name, id) {
    const k = key(name, id);
    if (locations.has(k)) return locations.get(k);
    const s = sheet(name), last = s.getLastRow();
    const cell = last > 1 ? s.getRange(2, 1, last - 1, 1).createTextFinder(id).matchEntireCell(true).useRegularExpression(false).findNext() : null;
    const row = cell ? cell.getRow() : 0;
    locations.set(k, row); return row;
  }
  const db = {
    get(name, id) {
      const k = key(name, id);
      if (pending.has(k)) return pending.get(k).value;
      const row = find(name, id);
      if (!row) return null;
      const raw = sheet(name).getRange(row, 6).getValue();
      return raw ? JSON.parse(raw) : null;
    },
    list(name, filter = {}) {
      const s = sheet(name), last = s.getLastRow();
      if (last > 20001) throw new Error('Bảng vượt giới hạn 20000 dòng.');
      const rows = last > 1 ? s.getRange(2, 1, last - 1, 6).getValues() : [];
      const result = new Map();
      rows.forEach((r, i) => { if (r[0] && r[5]) { locations.set(key(name, r[0]), i + 2); result.set(r[0], JSON.parse(r[5])); } });
      pending.forEach(p => { if (p.name === name) { if (p.value) result.set(p.id, p.value); else result.delete(p.id); } });
      return [...result.values()].filter(r => !filter.studentId || r.studentId === filter.studentId);
    },
    put(name, value) { pending.set(key(name, value.id), { name, id: value.id, value }); },
    remove(name, id) { pending.set(key(name, id), { name, id, value: null }); },
    removeStudent(name, studentId) { this.list(name, { studentId }).forEach(r => this.remove(name, r.id)); },
    commit() {
      const requests = [], allocated = new Map();
      pending.forEach(p => {
        const s = sheet(p.name), cols = headers_(p.name);
        let row = find(p.name, p.id);
        if (!row && !p.value) return;
        if (!row) {
          if (!allocated.has(p.name)) {
            const last = s.getLastRow();
            const ids = last > 1 ? s.getRange(2, 1, last - 1, 1).getValues() : [];
            allocated.set(p.name, ids.map((r, i) => r[0] ? 0 : i + 2).filter(Boolean));
            nextRows.set(p.name, last + 1);
          }
          row = allocated.get(p.name).shift() || nextRows.get(p.name);
          if (row === nextRows.get(p.name)) nextRows.set(p.name, row + 1);
        }
        const cap = p.name === 'Students' ? 501 : p.name === 'Versions' ? 301 : 20001;
        if (row > cap) throw Object.assign(new Error('Kho đã đầy. Giáo viên cần xuất dữ liệu và chạy dọn dữ liệu hết hạn.'), { status: 429 });
        if (row > s.getMaxRows()) {
          const known = requests.filter(r => r.appendDimension && r.appendDimension.sheetId === s.getSheetId()).reduce((n, r) => n + r.appendDimension.length, s.getMaxRows());
          if (row > known) requests.push({ appendDimension: { sheetId: s.getSheetId(), dimension: 'ROWS', length: row - known } });
        }
        const values = cols.map(col => ({ userEnteredValue: { stringValue: !p.value ? '' : col === 'data' ? JSON.stringify(p.value) : String(p.value[col] ?? '') } }));
        requests.push({ updateCells: { start: { sheetId: s.getSheetId(), rowIndex: row - 1, columnIndex: 0 }, rows: [{ values }], fields: 'userEnteredValue' } });
      });
      if (requests.length) Sheets.Spreadsheets.batchUpdate({ requests }, id);
    },
  };
  return db;
}
function setup() {
  const properties = PropertiesService.getScriptProperties();
  if ((properties.getProperty('GATEWAY_SECRET') || '').length < 32) throw new Error('Đặt GATEWAY_SECRET ít nhất 32 ký tự ngẫu nhiên.');
  const book = SpreadsheetApp.openById(properties.getProperty('SPREADSHEET_ID'));
  TABLES.forEach(name => {
    const s = book.getSheetByName(name) || book.insertSheet(name), h = headers_(name);
    if (s.getLastRow() === 0) { s.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold'); s.setFrozenRows(1); }
  });
  const db = sheetDatabase_();
  if (!db.get('Settings', 'active')) db.put('Settings', { id: 'active', versionId: 'base', revision: 0, updatedAt: new Date().toISOString() });
  db.commit();
}
function purgeExpired() {
  const lock = LockService.getScriptLock();
  lock.waitLock(8000);
  try { const db = sheetDatabase_(); const result = runOperation(db, 'purge', { teacher: true }); db.commit(); return result; }
  finally { lock.releaseLock(); }
}
