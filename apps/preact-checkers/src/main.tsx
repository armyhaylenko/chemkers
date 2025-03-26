import { render } from 'preact';
import init from 'wasm-checkers';

await init();

import './styles/index.scss';
import App from './components/core/App';
import { BoardContextProvider, NetworkProvider } from './context';

const rootElement = document.getElementById('root') as HTMLElement;

render(
  <NetworkProvider>
    <BoardContextProvider>
      <App />
    </BoardContextProvider>
  </NetworkProvider>,
  rootElement
);
