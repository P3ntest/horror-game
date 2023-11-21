import { PhysicsEngine } from "./PhysicsEngine";
import { Entity } from "./Entity";
import { Renderer } from "./Renderer";
import { Ticker } from "./util/Ticker";
export class World {
  renderer: Renderer = new Renderer();
  physicsEngine: PhysicsEngine = new PhysicsEngine();
  physicsTicker: Ticker = new Ticker((n) => this.physicsTick(n));

  physicsTick(deltaTime: number) {
    for (const entity of this.entities) {
      entity.onUpdate(deltaTime);
    }
    this.physicsEngine.step();
    for (const entity of this.entities) {
      entity.onPostUpdate(deltaTime);
    }
  }

  renderTicks: number = 0;
  renderTick() {
    for (const entity of this.entities) {
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
  }
}
