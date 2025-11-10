import type { Scene } from '@engine/app';
import type { GameApp } from '@engine/app';
import { TILE_SIZE, PLAYER_SPEED, CAMERA_LERP, DEBUG_INITIAL, SAVE_KEY } from '@game/config';
import { setLastAction } from '@game/telemetry';
import { createWorld, type SavedState } from '@game/world';
import { ECS, type Entity } from '@engine/ecs';
import { resources } from '@engine/resources';
import { WorkerPool } from '@engine/worker-pool';
import { load, save } from '@engine/save';
import { now } from '@engine/time';
import type { Tilemap } from '@engine/tilemap';
import { NpcController } from '@game/npc-controller';

export class Gameplay implements Scene {
  private readonly app: GameApp;
  private tilemap!: Tilemap;
  private readonly ecs = new ECS();
  private readonly workerPool = new WorkerPool();
  private player!: Entity;
  private npc!: Entity;
  private npcController!: NpcController;
  private debugEnabled = DEBUG_INITIAL;
  private lastSave = now();
  private playerWasMoving = false;

  constructor(app: GameApp) {
    this.app = app;
  }

  async init(): Promise<void> {
    setLastAction('Gameplay:init');
    await resources.loadSpriteAtlas('main', '/src/assets/atlas.json');

    try {
      await resources.loadAudio('step', '/src/assets/step.ogg');
    } catch (error) {
      console.warn('Step audio not available', error);
    }

    const world = createWorld();
    this.tilemap = world.tilemap;

    const saved = load<SavedState | null>(SAVE_KEY, null);
    const startX = saved?.player.x ?? TILE_SIZE * 2;
    const startY = saved?.player.y ?? TILE_SIZE * 2;

    this.player = this.ecs.createEntity();
    this.ecs.setPosition(this.player, { x: startX, y: startY });
    this.ecs.setVelocity(this.player, { x: 0, y: 0 });
    this.ecs.setSprite(this.player, { textureKey: 'player', w: TILE_SIZE, h: TILE_SIZE });

    this.npc = this.ecs.createEntity();
    this.ecs.setPosition(this.npc, { x: TILE_SIZE * 10, y: TILE_SIZE * 10 });
    this.ecs.setVelocity(this.npc, { x: 0, y: 0 });
    this.ecs.setSprite(this.npc, { textureKey: 'npc', w: TILE_SIZE, h: TILE_SIZE });

    this.npcController = new NpcController({
      ecs: this.ecs,
      npc: this.npc,
      tilemap: this.tilemap,
      navMesh: world.navMesh,
      workerPool: this.workerPool
    });

    this.registerSystems();
    this.app.renderer.setCameraPosition(this.ecs.getPosition(this.player)!, 1);
    this.app.setHudOverlay('');
  }

  update(dt: number): void {
    if (this.app.input.wasPressed('F3')) {
      this.debugEnabled = !this.debugEnabled;
      this.app.renderer.toggleDebugGrid();
    }

    this.ecs.tick(dt);
    this.npcController.update();

    const playerPos = this.ecs.getPosition(this.player);
    if (playerPos) {
      this.app.renderer.setCameraPosition(playerPos, CAMERA_LERP);
      const timestamp = now();
      if (timestamp - this.lastSave > 2000) {
        save(SAVE_KEY, { player: playerPos });
        this.lastSave = timestamp;
      }
    }

    const npcPos = this.ecs.getPosition(this.npc);
    const overlayLines = [
      `Debug: ${this.debugEnabled ? 'ON' : 'OFF'}`,
      playerPos ? `Player: ${playerPos.x.toFixed(1)}, ${playerPos.y.toFixed(1)}` : 'Player: --',
      npcPos ? `NPC: ${npcPos.x.toFixed(1)}, ${npcPos.y.toFixed(1)}` : 'NPC: --',
      `Path nodes: ${this.npcController.getPathLength()}`,
      `Path pending: ${this.npcController.isPathPending() ? 'YES' : 'NO'}`
    ];
    this.app.setHudOverlay(overlayLines.join('\n'));
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.tilemap.render(this.app.renderer, 'ground');

    for (const entity of this.ecs.getEntitiesWith('position', 'sprite')) {
      const position = this.ecs.getPosition(entity)!;
      const sprite = this.ecs.getSprite(entity)!;
      this.app.renderer.drawSprite(sprite.textureKey, position.x, position.y, sprite.w, sprite.h);
    }

    if (this.debugEnabled) {
      this.renderDebugPath(ctx);
    }
  }

  dispose(): void {
    this.workerPool.dispose();
    this.app.setHudOverlay('');
  }

  private registerSystems(): void {
    this.ecs.registerSystem('input', (ecs) => {
      const velocity = ecs.getVelocity(this.player);
      if (!velocity) {
        return;
      }
      velocity.x = 0;
      velocity.y = 0;
      if (this.app.input.isPressed('ArrowUp') || this.app.input.isPressed('w')) {
        velocity.y -= PLAYER_SPEED;
      }
      if (this.app.input.isPressed('ArrowDown') || this.app.input.isPressed('s')) {
        velocity.y += PLAYER_SPEED;
      }
      if (this.app.input.isPressed('ArrowLeft') || this.app.input.isPressed('a')) {
        velocity.x -= PLAYER_SPEED;
      }
      if (this.app.input.isPressed('ArrowRight') || this.app.input.isPressed('d')) {
        velocity.x += PLAYER_SPEED;
      }
      const length = Math.hypot(velocity.x, velocity.y);
      if (length > PLAYER_SPEED) {
        velocity.x = (velocity.x / length) * PLAYER_SPEED;
        velocity.y = (velocity.y / length) * PLAYER_SPEED;
      }
      const moving = velocity.x !== 0 || velocity.y !== 0;
      if (moving && !this.playerWasMoving) {
        void resources.playAudio('step', { volume: 0.1 });
        const targetTile = this.tilemap.worldToTile(this.ecs.getPosition(this.player)!);
        void this.npcController.requestPathTo(targetTile);
        setLastAction('Gameplay:move');
      }
      this.playerWasMoving = moving;
    });

    this.ecs.registerSystem('physics', (ecs, dt) => {
      for (const entity of ecs.getEntitiesWith('position', 'velocity')) {
        const position = ecs.getPosition(entity)!;
        const velocity = ecs.getVelocity(entity)!;
        if (velocity.x === 0 && velocity.y === 0) {
          continue;
        }
        const nextX = position.x + velocity.x * dt;
        if (this.canOccupy(nextX, position.y)) {
          position.x = nextX;
        } else {
          velocity.x = 0;
        }
        const nextY = position.y + velocity.y * dt;
        if (this.canOccupy(position.x, nextY)) {
          position.y = nextY;
        } else {
          velocity.y = 0;
        }
      }
    });

    this.ecs.registerSystem('game', () => {
      if (!this.npcController.isPathPending() && this.npcController.getPathLength() === 0 && this.playerWasMoving) {
        const targetTile = this.tilemap.worldToTile(this.ecs.getPosition(this.player)!);
        void this.npcController.requestPathTo(targetTile);
      }
    });
  }

  private renderDebugPath(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = 'rgba(90, 209, 255, 0.25)';
    this.npcController.getPathNodes().forEach(({ node }, index) => {
      const screen = this.app.renderer.worldToScreen({ x: node.x, y: node.y });
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '10px var(--font-family, sans-serif)';
      ctx.fillText(String(index + 1), screen.x + 8, screen.y - 4);
      ctx.fillStyle = 'rgba(90, 209, 255, 0.25)';
    });
    ctx.restore();
  }

  private canOccupy(x: number, y: number): boolean {
    const tile = this.tilemap.worldToTile({ x, y });
    const tileId = this.tilemap.tileAt('collision', tile.x, tile.y);
    return tileId !== 2;
  }
}
