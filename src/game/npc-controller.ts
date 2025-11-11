import type { ECS, Entity } from '@engine/ecs';
import type { Tilemap } from '@engine/tilemap';
import type { NavMesh, NavNode } from '@workers/pathfinding';
import { vec2Normalize } from '@engine/math';
import type { WorkerPool } from '@engine/worker-pool';
import { PLAYER_SPEED } from './config';

export class NpcController {
  private readonly ecs: ECS;
  private readonly npc: Entity;
  private readonly tilemap: Tilemap;
  private readonly navMesh: NavMesh;
  private readonly workerPool: WorkerPool;
  private npcPath: string[] = [];
  private npcPathIndex = 0;
  private pathPending = false;

  constructor(options: {
    ecs: ECS;
    npc: Entity;
    tilemap: Tilemap;
    navMesh: NavMesh;
    workerPool: WorkerPool;
  }) {
    this.ecs = options.ecs;
    this.npc = options.npc;
    this.tilemap = options.tilemap;
    this.navMesh = options.navMesh;
    this.workerPool = options.workerPool;
  }

  getPathLength(): number {
    return this.npcPath.length;
  }

  getPathNodes(): Array<{ id: string; node: NavNode }> {
    return this.npcPath
      .map((id) => ({ id, node: this.navMesh.nodes[id] }))
      .filter((entry): entry is { id: string; node: NavNode } => Boolean(entry.node));
  }

  isPathPending(): boolean {
    return this.pathPending;
  }

  async requestPathTo(targetTile: { x: number; y: number }): Promise<void> {
    if (this.pathPending) {
      return;
    }
    const npcTile = this.tilemap.worldToTile(this.ecs.getPosition(this.npc)!);
    const start = `${npcTile.x},${npcTile.y}`;
    const end = `${targetTile.x},${targetTile.y}`;
    this.pathPending = true;
    try {
      const path = await this.workerPool.requestPath(this.navMesh, start, end);
      this.npcPath = path;
      this.npcPathIndex = 0;
    } finally {
      this.pathPending = false;
    }
  }

  update(): void {
    if (this.npcPath.length === 0) {
      const velocity = this.ecs.getVelocity(this.npc);
      if (velocity) {
        velocity.x = 0;
        velocity.y = 0;
      }
      return;
    }
    const npcPos = this.ecs.getPosition(this.npc);
    const npcVel = this.ecs.getVelocity(this.npc);
    if (!npcPos || !npcVel) {
      return;
    }
    const targetId = this.npcPath[this.npcPathIndex];
    const target = this.navMesh.nodes[targetId];
    if (!target) {
      this.npcPath = [];
      return;
    }
    const dx = target.x - npcPos.x;
    const dy = target.y - npcPos.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 4) {
      this.npcPathIndex += 1;
      if (this.npcPathIndex >= this.npcPath.length) {
        this.npcPath = [];
      }
      return;
    }
    const direction = vec2Normalize({ x: dx, y: dy });
    npcVel.x = direction.x * PLAYER_SPEED * 0.75;
    npcVel.y = direction.y * PLAYER_SPEED * 0.75;
  }
}
