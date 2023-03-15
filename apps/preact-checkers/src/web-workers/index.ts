export const wasmCheckersWorker = new ComlinkWorker<
  typeof import('./wasm-checkers')
>(new URL('./wasm-checkers', import.meta.url), {
  type: 'module',
});
