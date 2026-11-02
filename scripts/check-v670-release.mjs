import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
const output = 'docs/v670/kiem-thu';
mkdirSync(output, { recursive: true });
const checks = [
  ['build', 'npm', ['run', 'build']],
  ['typecheck', 'npm', ['run', 'typecheck']],
  ['lint', 'npm', ['run', 'lint']],
  ['tests', 'npm', ['test']],
  ['browser', 'node', ['scripts/check-v670-ui.mjs']],
];
const results = [];
for (const [name, command, args] of checks) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    timeout: 180000,
    maxBuffer: 20000000,
  });
  const log = (result.stdout || '') + (result.stderr || '');
  writeFileSync(output + '/' + name + '.txt', log);
  const entry = {
    name,
    exitCode: result.status,
    error: result.error?.message || '',
    log: name + '.txt',
  };
  if (name === 'tests')
    for (const key of ['tests', 'pass', 'fail', 'skipped'])
      entry[key] = Number(log.match(new RegExp('(?:ℹ|#) ' + key + ' (\\d+)'))?.[1] || 0);
  results.push(entry);
  writeFileSync(
    output + '/results.json',
    JSON.stringify(
      {
        version: '6.7.0',
        recordedAt: new Date().toISOString(),
        scope:
          'Local app and real handlers with mocked AI/Sheets/audio providers. No production verification.',
        results,
      },
      null,
      2,
    ),
  );
  console.log(
    name,
    result.status === 0 ? 'PASS' : 'FAIL',
    name === 'tests' ? JSON.stringify(entry) : '',
  );
  if (result.status !== 0) {
    console.log(log.slice(-12000));
    process.exit(1);
  }
}
