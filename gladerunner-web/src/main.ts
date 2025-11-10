import '@ui/global.css';

import { GameApp } from '@engine/app';
import { MainMenu } from '@game/scenes/MainMenu';
import { getLastAction } from '@game/telemetry';

const canvas = document.getElementById('game');
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Game canvas missing');
}

const app = new GameApp(canvas);

window.addEventListener('resize', () => app.resize());

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    app.pause();
  } else {
    app.resume();
  }
});

window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error', {
    message,
    source,
    lineno,
    colno,
    error,
    scene: app.getCurrentSceneName(),
    lastAction: getLastAction()
  });
};

window.onunhandledrejection = (event) => {
  console.error('Unhandled rejection', {
    reason: event.reason,
    scene: app.getCurrentSceneName(),
    lastAction: getLastAction()
  });
};

const boot = async () => {
  await app.setScene(new MainMenu(app));
  await app.start();
};

void boot();
