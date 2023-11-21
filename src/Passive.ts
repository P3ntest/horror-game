import { ColliderDesc } from "@dimforge/rapier2d";
import { CharacterEntity } from "./engine/CharacterEntity";
import { Physics } from "./engine/PhysicsEngine";
import { Graphics } from "./engine/Renderer";

export class Sheep extends CharacterEntity {
  createCollider(): ColliderDesc {
    return Physics.ColliderDesc.ball(0.5);
  }
  onInitGraphics(): void {
    const body = new Graphics.Graphics();

    // top down sheep, white ellipse
    body.lineStyle(5, 0xa19f9f);
    body.beginFill(0xd6d6d6);
    body.drawEllipse(-10, 0, 50, 50);
    body.endFill();

    const head = new Graphics.Graphics();

    // head
    head.beginFill(0x333333);
    // head.lineStyle(5, 0xd6d6d6);
    head.drawEllipse(50, 0, 23, 23);
    head.endFill();

    this.container.addChild(head);
    this.container.addChild(body);
  }
}
