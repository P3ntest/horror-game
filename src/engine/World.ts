import { PhysicsEngine } from "./PhysicsEngine";
import { Entity } from "./Entity";
import { Renderer } from "./Renderer";
import { Ticker } from "./util/Ticker";
export class World {
  renderer: Renderer = new Renderer();
  physicsEngine: PhysicsEngine = new PhysicsEngine();
  physicsTicker: Ticker = new Ticker((n) => this.physicsTick(n));

  currentTick: number = 0;

  physicsTick(deltaTime: number) {
    this.currentTick++;
    for (const entity of this.entities) {
      if (entity.removed) continue;
      entity.onUpdate(deltaTime, this.currentTick);
    }
    this.physicsEngine.step();
    for (const entity of this.entities) {
      if (entity.removed) continue;
      entity.onPostUpdate(deltaTime, this.currentTick);
    }
  }

  renderTicks: number = 0;
  renderTick() {
    for (const entity of this.entities) {
      if (entity.removed) continue;
      entity._syncTransformToContainer();
      entity.onRender(this.renderTicks);
    }
    this.renderer.render();
    requestAnimationFrame(() => this.renderTick());
    this.renderTicks++;
  }

  constructor() {
    console.log("Created World");

    this.physicsTicker.start();
    this.renderTick();
  }

  entities: Set<Entity> = new Set();
  idMap: Map<string, Entity> = new Map();

  requireEntityById(id: string): Entity {
    const entity = this.idMap.get(id);
    if (entity === undefined) {
      throw new Error(`No entity with id ${id}`);
    }
    return entity;
  }

  addEntity(entity: Entity, id: string | null = null) {
    this.entities.add(entity);

    if (id !== null) {
      this.idMap.set(id, entity);
    }

    entity.world = this;
    entity.onInitGraphics();
    entity.onInitPhysics();
    entity._attachContainer();
    entity.onAdd();
  }

  removeEntity(entity: Entity) {
    this.entities.delete(entity);
    entity._remove();
    entity.onRemove();
  }
}
