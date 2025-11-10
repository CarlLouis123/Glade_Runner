import type { NavMesh } from '@workers/pathfinding';

interface PendingRequest {
  resolve: (path: string[]) => void;
  reject: (error: unknown) => void;
}

interface WorkerWithState {
  worker: Worker;
  busy: boolean;
  requestId?: number;
}

export class WorkerPool {
  private readonly workers: WorkerWithState[] = [];
  private readonly requests = new Map<number, PendingRequest>();
  private nextRequestId = 1;

  constructor(size = Math.max(1, Math.floor((navigator.hardwareConcurrency ?? 2) / 2))) {
    for (let i = 0; i < size; i += 1) {
      const worker = new Worker(new URL('../workers/ai.worker.ts', import.meta.url), {
        type: 'module'
      });
      const state: WorkerWithState = { worker, busy: false };
      worker.onmessage = (event) => {
        const { id, nodes } = event.data as { type: 'path'; id: number; nodes: string[] };
        const request = this.requests.get(id);
        if (request) {
          request.resolve(nodes);
          this.requests.delete(id);
        }
        state.busy = false;
        state.requestId = undefined;
      };
      worker.onerror = (error) => {
        console.error('Worker error', error);
        if (state.requestId) {
          const request = this.requests.get(state.requestId);
          if (request) {
            request.reject(error);
            this.requests.delete(state.requestId);
          }
        }
        state.busy = false;
        state.requestId = undefined;
      };
      this.workers.push(state);
    }
  }

  async requestPath(navmesh: NavMesh, start: string, end: string): Promise<string[]> {
    const id = this.nextRequestId;
    this.nextRequestId += 1;
    const available = this.workers.find((entry) => !entry.busy) ?? this.workers[0];
    available.busy = true;
    available.requestId = id;

    const promise = new Promise<string[]>((resolve, reject) => {
      this.requests.set(id, { resolve, reject });
      available.worker.postMessage({
        type: 'pathfind',
        id,
        payload: { start, end, navmesh }
      });
    });

    return promise;
  }

  dispose(): void {
    this.workers.forEach((entry) => entry.worker.terminate());
    this.requests.forEach((request) => request.reject(new Error('Worker pool disposed')));
    this.requests.clear();
  }
}
