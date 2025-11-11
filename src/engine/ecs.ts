export type Entity = number;

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface Sprite {
  textureKey: string;
  w: number;
  h: number;
}

type SystemStage = 'input' | 'physics' | 'game' | 'render';

type System = (ecs: ECS, dt: number) => void;

export class ECS {
  private nextEntity: Entity = 1;
  private readonly positions = new Map<Entity, Position>();
  private readonly velocities = new Map<Entity, Velocity>();
  private readonly sprites = new Map<Entity, Sprite>();
  private readonly systems: Record<SystemStage, System[]> = {
    input: [],
    physics: [],
    game: [],
    render: []
  };

  createEntity(): Entity {
    const id = this.nextEntity;
    this.nextEntity += 1;
    return id;
  }

  destroyEntity(entity: Entity): void {
    this.positions.delete(entity);
    this.velocities.delete(entity);
    this.sprites.delete(entity);
  }

  setPosition(entity: Entity, position: Position): void {
    this.positions.set(entity, position);
  }

  getPosition(entity: Entity): Position | undefined {
    return this.positions.get(entity);
  }

  setVelocity(entity: Entity, velocity: Velocity): void {
    this.velocities.set(entity, velocity);
  }

  getVelocity(entity: Entity): Velocity | undefined {
    return this.velocities.get(entity);
  }

  setSprite(entity: Entity, sprite: Sprite): void {
    this.sprites.set(entity, sprite);
  }

  getSprite(entity: Entity): Sprite | undefined {
    return this.sprites.get(entity);
  }

  getEntitiesWith(...components: Array<'position' | 'velocity' | 'sprite'>): Entity[] {
    const entities = new Set<Entity>();
    components.forEach((component) => {
      const collection = this.collectionFor(component);
      for (const entity of collection.keys()) {
        entities.add(entity);
      }
    });
    return Array.from(entities).filter((entity) =>
      components.every((component) => this.collectionFor(component).has(entity))
    );
  }

  registerSystem(stage: SystemStage, system: System): () => void {
    this.systems[stage].push(system);
    return () => {
      const list = this.systems[stage];
      const index = list.indexOf(system);
      if (index >= 0) {
        list.splice(index, 1);
      }
    };
  }

  tick(dt: number): void {
    this.runStage('input', dt);
    this.runStage('physics', dt);
    this.runStage('game', dt);
    this.runStage('render', dt);
  }

  private runStage(stage: SystemStage, dt: number): void {
    for (const system of this.systems[stage]) {
      system(this, dt);
    }
  }

  private collectionFor(component: 'position' | 'velocity' | 'sprite') {
    switch (component) {
      case 'position':
        return this.positions;
      case 'velocity':
        return this.velocities;
      case 'sprite':
        return this.sprites;
    }
  }
}
