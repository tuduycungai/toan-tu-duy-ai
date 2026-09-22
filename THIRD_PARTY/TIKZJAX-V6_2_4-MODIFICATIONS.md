# TikZJax integration modifications in application V6.2.4

Upstream: @rod2ik/tikzjax 1.6.0, https://github.com/rod2ik/tikzjax (GPL-3.0-or-later).
The existing upstream copyright notices and license files remain unchanged.

`public/tikz/run-tex.js` and `public/tikz/run-tex.min.js` are modified integration builds. In addition to the existing opaque `.gz.bin` asset naming, the application streams the trusted core dump through the bundled Pako inflater directly into the fixed WebAssembly memory buffer, then releases the preloaded buffer reference when executing TeX. It does not retain an additional decompressed core template. The fixed 2,500-page memory limit and upstream WASM/core assets remain unchanged.

Complete source of this integration patch: `scripts/patch-tikz-memory.mjs`, `scripts/tikz-core-stream.mjs`, `scripts/prepare-tikz.mjs`. Rebuild using the locked dependency with `npm ci` followed by `npm run build`. The patch stops the build if the pinned upstream markers do not match; it must be reviewed before upgrading the dependency.

The application wrapper also terminates workers on completion/cancellation, uses a versioned worker URL, and cleans up its iframe. These wrappers are supplied as source in `public/tikz-init.js`, `public/tikz-frame.js`, and `lib/tikz-compiler.ts`.

Keep this modification notice together with the existing third-party notices when redistributing the modified runtime. No upstream author attribution is replaced by this notice.
