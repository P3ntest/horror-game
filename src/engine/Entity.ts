import * as THREE from "three";
import { World } from "./World";
import { Quaternion, Vector } from "./util/vector";

export abstract class Entity {
  world!: World; // Late initialization by World.addEntity
  removed: boolean = false;

  constructor() {
    console.log("Created Entity");
  }

  /**
   * Called before physics update
   */
  onUpdate(deltaTime: number, currentTick: number) {}

  /**
   * Called after physics update
   */
  onPostUpdate(deltaTime: number, currentTick: number) {}

  /**
   * Called before rendering
   */
  onRender(tick: number) {}

  /**
   * Called when the entity is added to the world
   */
  onAdd() {}

  /**
   * Called when the entity is removed from the world
   */
  onRemove() {}

  /**
   * Called when the entity is added to the world
   */
  onInitGraphics() {}

  /**
   * Called when the entity is added to the world
   */
  onInitPhysics() {}

  _attachContainer() {
    this.world.renderer.scene.add(this.container);
  }

  _remove() {
    this.removed = true;
    this.world.renderer.scene.remove(this.container);
  }

  container: THREE.Group = new THREE.Group();
  _syncTransformToContainer() {
    const [x, y, z] = this.transform.getPosition();
    this.container.position.set(x, y, z);
    this.container.setRotationFromQuaternion(
      this.transform.getRotation().toThree()
    );
  }

  abstract get transform(): Transform;
}

export abstract class NonPhysicalEntity extends Entity {
  transform: Transform = new NonPhysicalTransform();
}

export interface Transform {
  getPosition(): Vector;
  getRotation(): Quaternion;
  setPosition(position: Vector): void;
  setRotation(rotation: Quaternion): void;
}

export class NonPhysicalTransform implements Transform {
  position: Vector = Vector.ZERO;
  rotation: Quaternion = Quaternion.IDENTITY;

  getPosition() {
    return this.position;
  }

  getRotation() {
    return this.rotation;
  }

  setPosition(position: Vector) {
    this.position = position;
  }

  setRotation(rotation: Quaternion) {
    this.rotation = rotation;
  }
}
