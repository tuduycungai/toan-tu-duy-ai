import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { parse } from 'acorn';
import { readFileSync } from 'node:fs';
import { createHmac, randomUUID } from 'node:crypto';
import { env, auth, event } from './v650-fixture.mjs';
import { CONSENT_VERSION } from '../server/learning/domain.mjs';
const domain = readFileSync(new URL('../google-apps-script/Domain.gs', import.meta.url), 'utf8');
const code = readFileSync(new URL('../google-apps-script/Code.gs', import.meta.url), 'utf8');
test('Apps Script payloads parse as ES2020 without logical assignment operators', () => {
  parse(domain + '\n' + code, { ecmaVersion: 2020, sourceType: 'script' });
});
function googleMock() {
  const book = new Map();
  let lockHeld = false,
    failBatch = false,
    batches = 0;
  class Sheet {
    constructor(name) {
      this.name = name;
      this.id = book.size + 1;
      this.rows = [];
      this.capacity = 1000;
    }
    getLastRow() {
      for (let i = this.rows.length - 1; i >= 0; i--)
        if (this.rows[i]?.some((x) => x !== '')) return i + 1;
      return 0;
    }
    getSheetId() {
      return this.id;
    }
    getMaxRows() {
      return this.capacity;
    }
    setFrozenRows() {
      return this;
    }
    getRange(row, col, count = 1, columns = 1) {
      const sheet = this;
      const range = {
        getValue: () => sheet.rows[row - 1]?.[col - 1] || '',
        getValues: () =>
          Array.from({ length: count }, (_, i) =>
            Array.from({ length: columns }, (_, j) => sheet.rows[row + i - 1]?.[col + j - 1] ?? ''),
          ),
        setValues: (values) => {
          values.forEach((v, i) => {
            sheet.rows[row + i - 1] ||= [];
            v.forEach((x, j) => (sheet.rows[row + i - 1][col + j - 1] = x));
          });
          return range;
        },
        setFontWeight: () => range,
        createTextFinder: (id) => {
          const finder = {
            matchEntireCell: () => finder,
            useRegularExpression: (flag) => {
              assert.equal(flag, false);
              return finder;
            },
            findNext: () => {
              for (let i = row; i < row + count; i++)
                if (sheet.rows[i - 1]?.[col - 1] === id) return { getRow: () => i };
              return null;
            },
          };
          return finder;
        },
      };
      return range;
    }
  }
  const shared = {
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) =>
          key === 'GATEWAY_SECRET' ? env.LEARNING_GATEWAY_SECRET : 'spreadsheet_test',
      }),
    },
    SpreadsheetApp: {
      openById: (id) => {
        assert.equal(id, 'spreadsheet_test');
        return {
          getSheetByName: (n) => book.get(n),
          insertSheet: (n) => {
            const s = new Sheet(n);
            book.set(n, s);
            return s;
          },
        };
      },
    },
    LockService: {
      getScriptLock: () => {
        let own = false;
        return {
          tryLock: () => {
            if (lockHeld) return false;
            lockHeld = own = true;
            return true;
          },
          hasLock: () => own,
          releaseLock: () => {
            lockHeld = own = false;
          },
        };
      },
    },
    Utilities: {
      computeHmacSha256Signature: (value, secret) =>
        [...createHmac('sha256', secret).update(value).digest()].map((x) =>
          x > 127 ? x - 256 : x,
        ),
    },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (text) => ({ setMimeType: () => text }),
    },
    Sheets: {
      Spreadsheets: {
        batchUpdate: ({ requests }) => {
          if (failBatch) throw Error('simulated atomic failure');
          batches++;
          for (const r of requests) {
            const id = r.updateCells?.start.sheetId || r.appendDimension?.sheetId;
            const s = [...book.values()].find((s) => s.id === id);
            if (r.appendDimension) s.capacity += r.appendDimension.length;
            else {
              const { start, rows } = r.updateCells;
              rows.forEach((row, i) => {
                s.rows[start.rowIndex + i] ||= [];
                row.values.forEach((v, j) => {
                  assert.equal(Object.keys(v.userEnteredValue)[0], 'stringValue');
                  s.rows[start.rowIndex + i][start.columnIndex + j] =
                    v.userEnteredValue.stringValue;
                });
              });
            }
          }
        },
      },
    },
  };
  const context = () => {
    const c = vm.createContext({ ...shared });
    vm.runInContext(domain + '\n' + code, c);
    return c;
  };
  const ctx = context();
  ctx.setup();
  function call(c, op, args, patch = {}) {
    const timestamp = Date.now(),
      nonce = randomUUID(),
      payload = JSON.stringify({ op, args });
    const signature = createHmac('sha256', env.LEARNING_GATEWAY_SECRET)
      .update(timestamp + '.' + nonce + '.' + payload)
      .digest('hex');
    return JSON.parse(
      c.doPost({
        postData: { contents: JSON.stringify({ timestamp, nonce, payload, signature, ...patch }) },
      }),
    );
  }
  return {
    ctx,
    context,
    call,
    book,
    get batches() {
      return batches;
    },
    fail: () => {
      failBatch = true;
    },
    recover: () => {
      failBatch = false;
    },
    hold: () => {
      lockHeld = true;
    },
    release: () => {
      lockHeld = false;
    },
  };
}
test('deployable Domain.gs exactly matches tested source modules', () => {
  const expected = ['server/learning/domain.mjs', 'server/learning/engine.mjs']
    .map((p) =>
      readFileSync(new URL('../' + p, import.meta.url), 'utf8')
        .replace(/^import\s+[\s\S]*?;\s*\n/gm, '')
        .replace(/^export /gm, ''),
    )
    .join('\n');
  assert.equal(domain.slice(domain.indexOf('\n') + 1), expected);
});
test('actual Apps Script gateway rejects forged signatures and busy locks before writing', () => {
  const g = googleMock(),
    initial = g.batches;
  assert.equal(g.call(g.ctx, 'enroll', auth, { signature: 'forged' }).ok, false);
  g.hold();
  const r = g.call(g.ctx, 'status', auth);
  assert.equal(r.status, 503);
  g.release();
  assert.equal(g.batches, initial);
});
test('actual Sheet adapter commits all changes in one batch, deduplicates across script instances and writes formula text literally', () => {
  const g = googleMock();
  assert(
    g.call(g.ctx, 'enroll', {
      ...auth,
      consent: true,
      guardianConfirmed: true,
      consentVersion: CONSENT_VERSION,
    }).ok,
  );
  const before = g.batches,
    e = event({ answer: '=IMPORTXML("https://bad.example","//a")' });
  const r = g.call(g.ctx, 'ingest', { ...auth, event: e });
  assert(r.ok, JSON.stringify(r));
  assert.equal(g.batches - before, 1);
  const other = g.context();
  const again = g.call(other, 'ingest', { ...auth, event: e });
  assert(again.data.duplicate);
  assert.equal(g.book.get('Turns').getLastRow(), 2);
  const profile = g.call(other, 'status', auth).data.profile;
  assert.equal(profile.observedTurns, 1);
  const raw = g.book.get('Turns').rows[1];
  assert.equal(raw[9], e.answer);
});
test('actual failed Sheets batch cannot leave an event without its profile and is safe to retry', () => {
  const g = googleMock();
  g.call(g.ctx, 'enroll', {
    ...auth,
    consent: true,
    guardianConfirmed: true,
    consentVersion: CONSENT_VERSION,
  });
  const e = event();
  g.fail();
  assert.equal(g.call(g.ctx, 'ingest', { ...auth, event: e }).ok, false);
  assert.equal(g.book.get('Turns').getLastRow(), 1);
  assert.equal(g.book.get('Profiles').getLastRow(), 1);
  g.recover();
  assert.equal(g.call(g.ctx, 'ingest', { ...auth, event: e }).ok, true);
  assert.equal(g.book.get('Turns').getLastRow(), 2);
  assert.equal(g.call(g.ctx, 'delete', auth).data.deleted, true);
  assert.equal(g.book.get('Turns').getLastRow(), 1);
});
