import './ui/global.css';

import { GameApp } from './game/GameApp';

const canvas = document.getElementById('game');
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Expected a canvas element with id="game"');
}

const app = new GameApp(canvas);

const onResize = () => app.resize();
window.addEventListener('resize', onResize);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    app.pause();
  } else {
    app.resume();
  }
});

app.start();
