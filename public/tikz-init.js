// Track every compiler worker so timeout/cancel really releases CPU and WASM memory.
const NativeWorker=window.Worker,workers=new Set();
window.Worker=class extends NativeWorker{constructor(...args){super(...args);workers.add(this);}terminate(){workers.delete(this);return super.terminate();}};
window.stopTikzWorkers=()=>{for(const worker of workers)worker.terminate();workers.clear();};
window.addEventListener('pagehide',window.stopTikzWorkers);
window.TikzJaxOptions={renderTimeout:25000,maxRetries:0,theme:{fallbackTheme:'light',followSystemTheme:false}};
