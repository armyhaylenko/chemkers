import style from './App.module.scss';
import CheckersBoard from '../../checkers/CheckersBoard';
import { SessionOverlay } from '../../overlays/SessionOverlay';

function App() {
  return (
    <main className={style.main}>
      <div class={style.board}>
        <CheckersBoard/>
      </div>
			<SessionOverlay/>
    </main>
  );
}

export default App;
