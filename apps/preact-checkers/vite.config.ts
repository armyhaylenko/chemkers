import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import topLevelAwait from 'vite-plugin-top-level-await';

import replaceEnv from './plugins/vite-plugin-replace-env';

export default defineConfig({
  base: '',
  plugins: [
    preact(),
    replaceEnv(),
    topLevelAwait({
      promiseExportName: '__tla',
      promiseImportName: (i) => `__tla_${i}`,
    }),
  ],
});
