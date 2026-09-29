import {
  cpSync,
  mkdirSync,
  readdirSync,
  renameSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { patchWorkerMemory } from './patch-tikz-memory.mjs';

rmSync('public/tikz', { recursive: true, force: true });
mkdirSync('public/tikz', { recursive: true });
cpSync('node_modules/@rod2ik/tikzjax/dist', 'public/tikz', { recursive: true });

function opaque(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) opaque(p);
    else if (p.endsWith('.gz')) renameSync(p, p + '.bin');
  }
}
opaque('public/tikz');
for (const name of ['run-tex.js', 'run-tex.min.js']) {
  const p = 'public/tikz/' + name;
  const source = readFileSync(p, 'utf8')
    .replaceAll('tex.wasm.gz', 'tex.wasm.gz.bin')
    .replaceAll('core.dump.gz', 'core.dump.gz.bin')
    .replaceAll('${A}.gz`', '${A}.gz.bin`');
  writeFileSync(p, patchWorkerMemory(source));
}
