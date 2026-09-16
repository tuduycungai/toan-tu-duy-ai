import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],build:{outDir:'qa-build',emptyOutDir:true,rolldownOptions:{input:'qa/v61-smoke.html'}}});
