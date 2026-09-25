import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { useSurveyReminder, SURVEY_INTERVAL_MS } from '../lib/use-survey-reminder.ts';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
function Harness(props) {
  useSurveyReminder(props);
  return null;
}

async function setup(t, initial = {}) {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const oldDocument = globalThis.document;
  globalThis.document = Object.assign(new EventTarget(), { hidden: false });
  let calls = 0,
    root,
    props = { enabled: true, open: false, blocked: false, onRemind: () => calls++, ...initial };
  await act(async () => {
    root = create(React.createElement(Harness, props));
  });
  let mounted = true;
  async function close() {
    if (mounted) {
      await act(async () => root.unmount());
      mounted = false;
    }
  }
  t.after(async () => {
    await close();
    globalThis.document = oldDocument;
  });
  return {
    calls: () => calls,
    tick: (ms) => act(async () => t.mock.timers.tick(ms)),
    update: (patch) =>
      act(async () => {
        props = { ...props, ...patch };
        root.update(React.createElement(Harness, props));
      }),
    visibility: (hidden) =>
      act(async () => {
        document.hidden = hidden;
        document.dispatchEvent(new Event('visibilitychange'));
      }),
    close,
  };
}

test('survey first appears at exactly thirteen minutes and repeats after dismissal', async (t) => {
  const r = await setup(t);
  assert.equal(SURVEY_INTERVAL_MS, 780000);
  await r.tick(779999);
  assert.equal(r.calls(), 0);
  await r.tick(1);
  assert.equal(r.calls(), 1);
  await r.update({ open: true });
  await r.update({ open: false });
  await r.tick(779999);
  assert.equal(r.calls(), 1);
  await r.tick(1);
  assert.equal(r.calls(), 2);
});

test('an open survey counts as the reminder and does not immediately reopen on close', async (t) => {
  const r = await setup(t, { open: true });
  await r.tick(780000);
  assert.equal(r.calls(), 0);
  await r.update({ open: false });
  assert.equal(r.calls(), 0);
  await r.tick(780000);
  assert.equal(r.calls(), 1);
});

test('busy or conflicting dialogs defer and coalesce multiple reminders into one', async (t) => {
  const r = await setup(t, { blocked: true });
  for (let i = 0; i < 3; i++) await r.tick(780000);
  assert.equal(r.calls(), 0);
  await r.update({ blocked: false });
  assert.equal(r.calls(), 1);
  await r.update({ blocked: true });
  await r.update({ blocked: false });
  assert.equal(r.calls(), 1);
});

test('hidden tabs wait until visible without accumulating survey dialogs', async (t) => {
  const r = await setup(t);
  await r.visibility(true);
  await r.tick(780000);
  await r.tick(780000);
  assert.equal(r.calls(), 0);
  await r.visibility(false);
  assert.equal(r.calls(), 1);
});

test('connection and profile are required; disconnect cancels pending reminders', async (t) => {
  const r = await setup(t, { enabled: false });
  await r.tick(1560000);
  assert.equal(r.calls(), 0);
  await r.update({ enabled: true, blocked: true });
  await r.tick(780000);
  await r.update({ enabled: false, blocked: false });
  assert.equal(r.calls(), 0);
  await r.update({ enabled: true });
  await r.tick(779999);
  assert.equal(r.calls(), 0);
  await r.tick(1);
  assert.equal(r.calls(), 1);
});

test('ordinary rerenders use the latest callback without restarting the thirteen-minute clock', async (t) => {
  const r = await setup(t);
  let latest = 0;
  await r.tick(779000);
  await r.update({ onRemind: () => latest++ });
  await r.tick(1000);
  assert.equal(latest, 1);
  assert.equal(r.calls(), 0);
});

test('unmount removes the timer and visibility listener', async (t) => {
  const r = await setup(t);
  await r.close();
  await r.tick(1560000);
  await r.visibility(false);
  assert.equal(r.calls(), 0);
});
