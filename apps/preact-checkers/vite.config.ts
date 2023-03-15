import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { comlink } from 'vite-plugin-comlink';
import topLevelAwait from 'vite-plugin-top-level-await';

// Custom plugin to replace vite environment variables with built asset names, so they can be
// loaded within a web-worker
import replaceEnv from './plugins/vite-plugin-replace-env';

export default defineConfig({
  base: '',
  plugins: [
    preact(),
    comlink(),
    replaceEnv(),
    topLevelAwait({
      promiseExportName: '__tla',
      promiseImportName: (i) => `__tla_${i}`,
    }),
  ],
  worker: {
    plugins: [comlink()],
  },
});
