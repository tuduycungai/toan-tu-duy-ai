// Track every compiler worker so timeout/cancel really releases CPU and WASM memory.
const NativeWorker = window.Worker,
  workers = new Set();
window.Worker = class extends NativeWorker {
  constructor(url, options) {
    if ((typeof url === 'string' || url instanceof URL) && String(url).includes('run-tex')) {
      const asset = new URL(url, location.href);
      asset.searchParams.set('v', '6.2.4');
      url = asset.href;
    }
    super(url, options);
    workers.add(this);
  }
  terminate() {
    workers.delete(this);
    return super.terminate();
  }
};
window.stopTikzWorkers = () => {
  for (const worker of workers) worker.terminate();
  workers.clear();
};
window.addEventListener('pagehide', window.stopTikzWorkers);
window.TikzJaxOptions = {
  workerUrl: '/tikz/run-tex.js?v=6.2.4',
  renderTimeout: 25000,
  maxRetries: 0,
  theme: { fallbackTheme: 'light', followSystemTheme: false },
};
