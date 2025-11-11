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
import type { NavMesh } from '@workers/pathfinding';
import { MiniMap } from '@game/minimap';

interface RoamingNpcConfig {
  name: string;
  spriteKey: string;
  startTile: { x: number; y: number };
  roamArea: { minX: number; maxX: number; minY: number; maxY: number };
  wisdom: string[];
}

interface RoamingNpc {
  entity: Entity;
  controller: NpcController;
  name: string;
  wisdom: string[];
  spriteKey: string;
  roamArea: RoamingNpcConfig['roamArea'];
  nextDecision: number;
  currentQuote: string | null;
  quoteVisible: boolean;
  nextQuoteRefresh: number;
}

export class Gameplay implements Scene {
  private readonly app: GameApp;
  private tilemap!: Tilemap;
  private readonly ecs = new ECS();
  private readonly workerPool = new WorkerPool();
  private player!: Entity;
  private npcs: RoamingNpc[] = [];
  private miniMap!: MiniMap;
  private debugEnabled = DEBUG_INITIAL;
  private lastSave = now();
  private playerWasMoving = false;

  private readonly wisdomOverlay: Set<string> = new Set();

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
    const defaultStart = this.tileToWorld(108, 84);
    const startX = saved?.player.x ?? defaultStart.x;
    const startY = saved?.player.y ?? defaultStart.y;

    this.player = this.ecs.createEntity();
    this.ecs.setPosition(this.player, { x: startX, y: startY });
    this.ecs.setVelocity(this.player, { x: 0, y: 0 });
    this.ecs.setSprite(this.player, { textureKey: 'player', w: TILE_SIZE, h: TILE_SIZE });

    this.miniMap = new MiniMap({
      tilemap: this.tilemap,
      groundLayer: world.layers.ground,
      featureLayer: world.layers.features
    });

    this.prepareNpcSprites();
    this.spawnRoamingNpcs(world.navMesh);

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

    const playerPos = this.ecs.getPosition(this.player);
    if (playerPos) {
      this.app.renderer.setCameraPosition(playerPos, CAMERA_LERP);
      const timestamp = now();
      if (timestamp - this.lastSave > 2000) {
        save(SAVE_KEY, { player: playerPos });
        this.lastSave = timestamp;
      }
    }

    const npcInfos = this.updateRoamingNpcs(playerPos);
    const overlayLines = [
      `Debug: ${this.debugEnabled ? 'ON' : 'OFF'}`,
      playerPos ? `Player: ${playerPos.x.toFixed(1)}, ${playerPos.y.toFixed(1)}` : 'Player: --',
      `NPCs wandering: ${npcInfos.total}`,
      `NPCs speaking: ${npcInfos.speaking}`
    ];
    this.wisdomOverlay.forEach((line) => overlayLines.push(line));
    this.app.setHudOverlay(overlayLines.join('\n'));
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.tilemap.render(this.app.renderer, 'ground');
    this.tilemap.render(this.app.renderer, 'features');

    for (const entity of this.ecs.getEntitiesWith('position', 'sprite')) {
      const position = this.ecs.getPosition(entity)!;
      const sprite = this.ecs.getSprite(entity)!;
      this.app.renderer.drawSprite(sprite.textureKey, position.x, position.y, sprite.w, sprite.h);
    }

    this.renderNpcDialog(ctx);
    this.miniMap.render(
      ctx,
      this.ecs.getPosition(this.player),
      this.npcs
        .map((npc) => this.ecs.getPosition(npc.entity))
        .filter((pos): pos is { x: number; y: number } => Boolean(pos)),
      this.app.renderer.getViewport()
    );

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

  }

  private renderDebugPath(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = 'rgba(90, 209, 255, 0.25)';
    this.npcs
      .flatMap((npc) => npc.controller.getPathNodes())
      .forEach(({ node }, index) => {
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
    return tileId !== 1 && tileId !== undefined;
  }

  private prepareNpcSprites(): void {
    const spriteKeys = ['player', 'npc:traveler', 'npc:scholar', 'npc:ranger', 'npc:oracle'];
    spriteKeys.forEach((key) => {
      resources.registerTexture(key, null, { x: 0, y: 0, w: TILE_SIZE, h: TILE_SIZE });
    });
  }

  private spawnRoamingNpcs(navMesh: NavMesh): void {
    const configs: RoamingNpcConfig[] = [
      {
        name: 'Iris the Traveler',
        spriteKey: 'npc:traveler',
        startTile: { x: 56, y: 116 },
        roamArea: { minX: 50, maxX: 70, minY: 108, maxY: 126 },
        wisdom: [
          'Every horizon is just a promise to walk a little farther.',
          'Maps are love letters written to the curious.',
          'A gentle breeze can guide a determined heart.'
        ]
      },
      {
        name: 'Sage Myrr',
        spriteKey: 'npc:scholar',
        startTile: { x: 104, y: 70 },
        roamArea: { minX: 96, maxX: 116, minY: 62, maxY: 78 },
        wisdom: [
          'Volcanoes teach us that even fire can be patient.',
          'Listen to the glow of magma and you will hear the earth dreaming.',
          'Knowledge is a lantern best shared along the trail.'
        ]
      },
      {
        name: 'Rolan of the Pines',
        spriteKey: 'npc:ranger',
        startTile: { x: 118, y: 96 },
        roamArea: { minX: 110, maxX: 132, minY: 88, maxY: 108 },
        wisdom: [
          'Trees remember every whisper you offer them.',
          'Paths bloom where kindness walks first.',
          'The forest hums in emerald and starlight alike.'
        ]
      },
      {
        name: 'Oracle Selene',
        spriteKey: 'npc:oracle',
        startTile: { x: 168, y: 110 },
        roamArea: { minX: 158, maxX: 180, minY: 102, maxY: 122 },
        wisdom: [
          'Lakes mirror the sky so we may drink the stars.',
          'Stillness is the bravest voyage.',
          'When you feel lost, follow the glow of your own awe.'
        ]
      }
    ];

    this.npcs = configs.map((config) => {
      const entity = this.ecs.createEntity();
      const start = this.tileToWorld(config.startTile.x, config.startTile.y);
      this.ecs.setPosition(entity, start);
      this.ecs.setVelocity(entity, { x: 0, y: 0 });
      this.ecs.setSprite(entity, { textureKey: config.spriteKey, w: TILE_SIZE, h: TILE_SIZE });

      const controller = new NpcController({
        ecs: this.ecs,
        npc: entity,
        tilemap: this.tilemap,
        navMesh,
        workerPool: this.workerPool
      });

      return {
        entity,
        controller,
        name: config.name,
        wisdom: config.wisdom,
        spriteKey: config.spriteKey,
        roamArea: config.roamArea,
        nextDecision: now(),
        currentQuote: null,
        quoteVisible: false,
        nextQuoteRefresh: 0
      } satisfies RoamingNpc;
    });
  }

  private updateRoamingNpcs(
    playerPos: { x: number; y: number } | undefined
  ): { total: number; speaking: number } {
    const currentTime = now();
    let speaking = 0;
    this.wisdomOverlay.clear();

    this.npcs.forEach((npc) => {
      npc.controller.update();

      if (!npc.controller.isPathPending() && npc.controller.getPathLength() === 0 && currentTime >= npc.nextDecision) {
        const target = this.pickRandomTile(npc.roamArea);
        if (target) {
          void npc.controller.requestPathTo(target);
        }
        npc.nextDecision = currentTime + 1500 + Math.random() * 4000;
      }

      if (!playerPos) {
        npc.quoteVisible = false;
        return;
      }

      const npcPos = this.ecs.getPosition(npc.entity);
      if (!npcPos) {
        npc.quoteVisible = false;
        return;
      }

      const distance = Math.hypot(npcPos.x - playerPos.x, npcPos.y - playerPos.y);
      if (distance < TILE_SIZE * 2) {
        npc.quoteVisible = true;
        speaking += 1;
        if (currentTime >= npc.nextQuoteRefresh || !npc.currentQuote) {
          npc.currentQuote = npc.wisdom[Math.floor(Math.random() * npc.wisdom.length)];
          npc.nextQuoteRefresh = currentTime + 6000;
        }
        if (npc.currentQuote) {
          this.wisdomOverlay.add(`${npc.name}: "${npc.currentQuote}"`);
        }
      } else {
        npc.quoteVisible = false;
      }
    });

    return { total: this.npcs.length, speaking };
  }

  private renderNpcDialog(ctx: CanvasRenderingContext2D): void {
    this.npcs.forEach((npc) => {
      if (!npc.quoteVisible || !npc.currentQuote) {
        return;
      }
      const pos = this.ecs.getPosition(npc.entity);
      if (!pos) {
        return;
      }
      const screen = this.app.renderer.worldToScreen({ x: pos.x, y: pos.y - TILE_SIZE * 0.75 });
      const padding = 8;
      const maxWidth = 220;
      ctx.save();
      ctx.font = '12px var(--font-family, sans-serif)';
      const lines = this.wrapText(ctx, npc.currentQuote, maxWidth - padding * 2);
      const textHeight = lines.length * 14;
      const width = maxWidth;
      const height = textHeight + padding * 2 + 16;
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = 'rgba(12, 22, 32, 0.85)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      this.drawRoundedRect(ctx, screen.x - width / 2, screen.y - height, width, height, 12);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(screen.x - 12, screen.y - 4);
      ctx.lineTo(screen.x, screen.y + 10);
      ctx.lineTo(screen.x + 12, screen.y - 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f5f5f5';
      lines.forEach((line, index) => {
        ctx.fillText(line, screen.x - width / 2 + padding, screen.y - height + padding + index * 14);
      });
      ctx.restore();
    });
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  private tileToWorld(tx: number, ty: number): { x: number; y: number } {
    return { x: tx * TILE_SIZE + TILE_SIZE / 2, y: ty * TILE_SIZE + TILE_SIZE / 2 };
  }

  private pickRandomTile(area: { minX: number; maxX: number; minY: number; maxY: number }): { x: number; y: number } | null {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const tx = Math.floor(Math.random() * (area.maxX - area.minX + 1)) + area.minX;
      const ty = Math.floor(Math.random() * (area.maxY - area.minY + 1)) + area.minY;
      const tileId = this.tilemap.tileAt('collision', tx, ty);
      if (tileId !== 1) {
        return { x: tx, y: ty };
      }
    }
    return null;
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
