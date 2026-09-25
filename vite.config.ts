import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'math-renderer', test: /node_modules[\\/]katex[\\/]/, priority: 2 },
            { name: 'ui-vendor', test: /node_modules/, priority: 1 },
          ],
        },
      },
    },
  },
});
