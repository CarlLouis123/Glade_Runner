import { aStar } from './pathfinding';
import type { NavMesh } from './pathfinding';

interface PathfindMessage {
  type: 'pathfind';
  id: number;
  payload: {
    start: string;
    end: string;
    navmesh: NavMesh;
  };
}

type WorkerMessage = PathfindMessage;

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  if (message.type === 'pathfind') {
    const path = aStar(message.payload.navmesh, message.payload.start, message.payload.end);
    self.postMessage({ type: 'path', id: message.id, nodes: path });
  }
};

export default null;
