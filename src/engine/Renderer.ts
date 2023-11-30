import * as THREE from "three";
import { Input } from "./util/Input";

export class Renderer {
  scene: THREE.Scene = new THREE.Scene();
  camera: THREE.Camera | null = null;

  renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer();

  constructor() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.scene.background = new THREE.Color(0x67683d);
    // this.renderer.shadowMap.enabled = true;

    const canvas = this.renderer.domElement;
    document.body.appendChild(canvas);
    document.body.addEventListener("click", () => {
      canvas.requestPointerLock();
    });
    document.body.addEventListener("mousemove", (e) => {
      Input.instance.addMouseMovement(e.movementX, e.movementY);
    });
  }

  render() {
    if (this.camera === null) {
      return;
    }
    this.renderer.render(this.scene, this.camera);
  }
}
