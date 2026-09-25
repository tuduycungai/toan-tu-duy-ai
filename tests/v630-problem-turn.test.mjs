import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTS } from './load-ts.mjs';
const { problemForConversation } = await loadTS('lib/problem-turn.ts');
const original = 'Cho hình bình hành ABCD. Gọi O là giao điểm AC và BD. Chứng minh OA = OC.';
test('student answers, named quadrilaterals and follow-up questions keep the original figure', () => {
  for (const answer of [
    'ABCD là hình bình hành.',
    'Vì hai đường chéo cắt nhau tại trung điểm mỗi đường.',
    'Em cần chứng minh ABCD là hình bình hành phải không?',
    'OA = OC',
    'Thầy gợi ý thêm giúp em.',
  ])
    assert.equal(problemForConversation(answer, original), original);
});
test('explicit new problems and constructions update the figure source', () => {
  const next = 'Cho hình vuông MNPQ. Chứng minh MP = NQ.';
  assert.equal(problemForConversation(next, original), next);
  assert.notEqual(problemForConversation('nối A với C.', original), original);
  assert.equal(problemForConversation('Hãy cho em một bài tương tự.', original), '');
});
