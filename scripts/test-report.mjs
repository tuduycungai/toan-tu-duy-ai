import { relative } from 'node:path';
/** Structured evidence from node:test events. No provider responses are recorded. */
export default async function* report(events) {
  for await (const event of events) {
    if (!['test:pass', 'test:fail'].includes(event.type)) continue;
    const d = event.data;
    yield JSON.stringify({
      name: d.name,
      file: d.file ? relative(process.cwd(), d.file) : '',
      line: d.line,
      status: d.skip ? 'skip' : event.type === 'test:pass' ? 'pass' : 'fail',
      skipReason: d.skip || '',
      durationMs: d.details?.duration_ms ?? null,
      recordedAt: new Date().toISOString(),
    }) + '\n';
  }
}
