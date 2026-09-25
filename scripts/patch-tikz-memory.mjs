import { streamCoreToMemory } from './tikz-core-stream.mjs';
/** Integration patch for @rod2ik/tikzjax 1.6.0; upstream GPL notices remain intact. */
export function patchWorkerMemory(source) {
  const start = 'const[e,r]=await Promise.all([$n("tex.wasm.gz.bin"),$n("core.dump.gz.bin")])';
  const end = '},async texify(t,e={})';
  const allocation = 'const r=(()=>{if(!Jn)';
  const afterAllocation = '})();pn(r.buffer)';
  for (const marker of [start, end, allocation, afterAllocation, 'YA({async load(A)'])
    if (source.split(marker).length !== 2)
      throw Error(
        'TikZJax 1.6.0 memory patch no longer matches. Do not ship an unpatched runtime.',
      );
  const loadStart = source.indexOf(start),
    loadEnd = source.indexOf(end, loadStart);
  source =
    source.slice(0, loadStart) +
    'qn=await WebAssembly.compile(await $n("tex.wasm.gz.bin"));Jn=await tutorLoadCoreMemory()' +
    source.slice(loadEnd);
  const allocStart = source.indexOf(allocation),
    allocEnd = source.indexOf(afterAllocation, allocStart);
  source =
    source.slice(0, allocStart) +
    'const r=Jn||await tutorLoadCoreMemory();Jn=null;pn(r.buffer)' +
    source.slice(allocEnd + afterAllocation.length);
  const loader =
    streamCoreToMemory.toString() +
    '\nasync function tutorLoadCoreMemory(){const memory=new WebAssembly.Memory({initial:on,maximum:on});return streamCoreToMemory(memory,await fetch(zn("core.dump.gz.bin")),()=>new Pr.Inflate({chunkSize:65536}));}\n';
  return source.replace('YA({async load(A)', loader + 'YA({async load(A)');
}
