import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { loadTS } from './load-ts.mjs';
const { useLearningMemory, filteredQueue, addPending } = await loadTS('lib/learning-memory.ts');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
async function harness(t, responder) {
  const values = new Map(),
    events = new EventTarget();
  let current, tree;
  t.mock.method(globalThis, 'fetch', async (_url, options) => responder(JSON.parse(options.body)));
  globalThis.localStorage = {
    getItem: (k) => values.get(k),
    setItem: (k, v) => values.set(k, v),
    removeItem: (k) => values.delete(k),
  };
  globalThis.addEventListener = events.addEventListener.bind(events);
  globalThis.removeEventListener = events.removeEventListener.bind(events);
  function Component() {
    current = useLearningMemory();
    return React.createElement('p', {}, current.status);
  }
  await act(async () => {
    tree = create(React.createElement(Component));
  });
  t.after(async () => {
    await act(async () => tree.unmount());
  });
  return {
    get memory() {
      return current;
    },
    values,
  };
}
test('browser queue has fixed identity, size, age and attempt limits', () => {
  const now = Date.now(),
    base = { receipt: 'signed', at: now, attempts: 0 };
  let list = Array.from({ length: 20 }, (_, i) => ({ ...base, id: String(i) }));
  list = addPending(list, { ...base, id: '20' });
  assert.equal(list.length, 20);
  assert.equal(list[0].id, '1');
  list = addPending(list, { ...base, id: '20' });
  assert.equal(list.length, 20);
  assert.equal(
    filteredQueue([
      { ...base, id: 'old', at: now - 86400001 },
      { ...base, id: 'too-many', attempts: 8 },
    ]).length,
    0,
  );
});
test('declining consent never calls enroll, and default never attaches memory metadata', async (t) => {
  const h = await harness(t, () => assert.fail('No storage request expected'));
  assert.equal(h.memory.request().memory, undefined);
  await assert.rejects(h.memory.activate('HOCGIOITOAN', false));
  assert.equal(h.memory.enabled, false);
});
test('pending UI never says saved and pause clears queued receipts before a failed server acknowledgment', async (t) => {
  const h = await harness(t, (b) =>
    b.action === 'enroll'
      ? Response.json({ studentId: 'student_test', consent: true, recovery: 'private' })
      : Promise.reject(Error('offline')),
  );
  await act(async () => h.memory.activate('HOCGIOITOAN', true));
  const epoch = h.memory.request().epoch;
  await act(async () =>
    h.memory.accept(
      {
        status: 'pending',
        eventId: 'event_test',
        receipt: 'signed',
        message: 'Chưa xác nhận lưu.',
      },
      epoch,
    ),
  );
  assert.equal(h.memory.pending, 1);
  assert.match(h.memory.status, /Chưa xác nhận/);
  await act(async () => h.memory.stop());
  assert.equal(h.memory.enabled, false);
  assert.equal(h.memory.pending, 0);
  assert.equal(h.memory.request().memory, undefined);
  assert.equal(JSON.parse(h.values.get('tutor-memory-pending-v650')).length, 0);
  assert.equal(JSON.parse(h.values.get('tutor-memory-v650')).stopPending, true);
  await act(async () => h.memory.accept({ status: 'saved', message: 'STALE success' }, epoch));
  assert(!h.memory.status.includes('STALE'));
});
test('retry receipt is removed only after a confirmed server result', async (t) => {
  let fail = true;
  const h = await harness(t, (b) =>
    b.action === 'enroll'
      ? Response.json({ studentId: 'student_test', consent: true })
      : fail
        ? Promise.reject(Error('offline'))
        : Response.json({ results: [{ id: 'event_test', saved: true }] }),
  );
  await act(async () => h.memory.activate('HOCGIOITOAN', true));
  await act(async () =>
    h.memory.accept(
      { status: 'pending', eventId: 'event_test', receipt: 'signed' },
      h.memory.request().epoch,
    ),
  );
  await act(async () => h.memory.flush());
  assert.equal(h.memory.pending, 1);
  fail = false;
  await act(async () => h.memory.flush());
  assert.equal(h.memory.pending, 0);
  assert.match(h.memory.status, /đã xác nhận/);
});

test('local learning preferences can be remembered without personal identity fields', async () => {
  const { readProfile, emptyProfile } = await loadTS('lib/tutor.ts');
  globalThis.localStorage = {
    getItem: () => JSON.stringify({ ...emptyProfile, level: 'Khá', difficulties: [] }),
  };
  const profile = readProfile();
  assert.equal(profile.level, 'Khá');
  assert.equal(profile.email, '');
  assert.equal(profile.school, '');
});
