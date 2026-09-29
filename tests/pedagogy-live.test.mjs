import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { handleChat } from '../server/gemini.mjs';
import { cases } from './pedagogy-cases.mjs';

const enabled = process.env.RUN_PEDAGOGY_LIVE === '1' && !!process.env.GEMINI_API_KEY;
test(
  'live Gemini pedagogical acceptance (opt-in; semantic review required)',
  { skip: enabled ? false : 'No opt-in/key: model behavior has NOT been verified' },
  async (t) => {
    const results = [];
    for (const c of cases)
      await t.test(c.id, async () => {
        const response = await handleChat(
          new Request('http://localhost/api/chat', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              accessCode: process.env.ACCESS_CODE || 'HOCGIOITOAN',
              mode: 'guide',
              messages: c.messages,
            }),
          }),
          process.env,
        );
        const data = await response.json();
        assert.equal(response.status, 200, data.error);
        results.push({
          id: c.id,
          rubric: c.rubric,
          response: data.text,
          model: data.model,
          semanticReview: 'PENDING',
        });
        await mkdir('research/live-results', { recursive: true });
        await writeFile('research/live-results/pedagogy.json', JSON.stringify(results, null, 2));
        const s = data.text;
        assert.equal((s.match(/\[SO_DO\]/g) || []).length, 1);
        assert.match(
          s,
          /^\[SO_DO\]\s*\nDU_KIEN: [^\n]+\nMUC_TIEU: [^\n]+\nCAU_NOI: [^\n]+\nBUOC_TIEP: [^\n]+\n\[\/SO_DO\]/,
        );
        assert.match(
          s,
          /Thao tác tư duy: (Phân tích|Tổng hợp|So sánh|Tương tự hóa|Đặc biệt hóa|Khái quát hóa|Phản ví dụ)/,
        );
        const done = s.trim().endsWith('[KET_THUC_BUOI_HOC]');
        if (!c.complete) assert.equal(done, false, 'Premature completion');
        else assert.equal(done, true, 'Understanding evidence should allow final summary');
        if (done) assert.equal((s.match(/\?/g) || []).length, 0);
        else {
          assert.equal((s.match(/Gợi mở:/g) || []).length, 1);
          assert.equal((s.match(/\?/g) || []).length, 1);
        }
        assert(
          s.trim().split(/\s+/).length <= (c.id === 'unknown-5' ? 380 : 200),
          'Response exceeds word budget with small tolerance',
        );
      });
  },
);
