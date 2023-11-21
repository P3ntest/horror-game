import { Vector } from "./vector";

export class Input {
  static instance: Input = new Input();

  constructor() {
    window.addEventListener("mousemove", (e) => {
      // this.mousePosition = new Vector(e.clientX ?? 0, e.clientY ?? 0);
    });
  }

  mouseMovement = [0, 0];

  addMouseMovement(x: number, y: number) {
    this.mouseMovement[0] += x;
    this.mouseMovement[1] += y;
  }

  flushMouseMovement() {
    const movement = this.mouseMovement;
    this.mouseMovement = [0, 0];
    return movement;
  }
}
