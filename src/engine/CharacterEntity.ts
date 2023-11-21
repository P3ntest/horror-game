import { ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d";
import { Physics, PhysicsEntity, toVector } from "./PhysicsEngine";

export abstract class CharacterEntity extends PhysicsEntity {
  createColliders(): ColliderDesc[] {
    return [this.createCollider()];
  }

  abstract createCollider(): Physics.ColliderDesc;

  getBodyDesc(): RigidBodyDesc {
    return Physics.RigidBodyDesc.kinematicVelocityBased();
  }

  gap: number = 0.1;

  controller!: Physics.KinematicCharacterController;
  onInitPhysics(): void {
    this.controller = this.world.physicsEngine.world.createCharacterController(
      this.gap
    );

    this.controller.setApplyImpulsesToDynamicBodies(true);
  }

  onRemove(): void {
    this.world.physicsEngine.world.removeCharacterController(this.controller);
  }

  desiredTranslation: Physics.Vector3 = new Physics.Vector3(0, 0, 0);

  get isGrounded(): boolean {
    return this.controller.computedGrounded();
  }

  onUpdate(deltaTime: number): void {
    this.controller.computeColliderMovement(
      this.colliders[0],
      this.desiredTranslation
    );

    const correctedMovement = toVector(this.controller.computedMovement());

    // const correctedLocation = correctedMovement.add(
    //   toVector(this.body.translation())
    // );

    if (deltaTime > 0) {
      this.body.setLinvel(
        correctedMovement.scale(1 / (deltaTime / 1000)),
        true
      );
    }
  }
}
