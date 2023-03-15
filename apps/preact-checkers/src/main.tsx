import { render } from 'preact';
import init from 'wasm-checkers';
import { wasmCheckersWorker } from './web-workers';

await init();
await wasmCheckersWorker.initWasm();

import './styles/index.scss';
import App from './components/core/App';
import { BoardContextProvider } from './context';

const rootElement = document.getElementById('root') as HTMLElement;

render(
  <BoardContextProvider>
    <App />
  </BoardContextProvider>,
  rootElement
);
