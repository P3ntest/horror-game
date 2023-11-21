import { ColliderDesc } from "@dimforge/rapier3d";
import { CharacterEntity } from "./engine/CharacterEntity";
import { Physics, toVector } from "./engine/PhysicsEngine";
import { KeyboardController } from "./engine/util/KeyboardController";
import { Vector } from "./engine/util/vector";
import { Input } from "./engine/util/Input";
import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { transformedNormalView } from "three/examples/jsm/nodes/Nodes.js";
import { playSound } from "./sound";
import { setFlashLightLevel, showFlashLightUI } from "./flashlight";
import { BlackThing } from "./BlackThing";

export class Player extends CharacterEntity {
  createCollider(): ColliderDesc {
    return Physics.ColliderDesc.capsule(0.5, 0.5);
  }

  controls: PointerLockControls;

  constructor() {
    super();
  }

  keyboardController = new KeyboardController();

  onAdd(): void {
    super.onAdd();
    this.keyboardController.attachTo(document.body);
    this.keyboardController.registerDefaults();

    this.controls = new PointerLockControls(
      this.world.renderer.camera,
      document.body
    );
  }

  onRender(tick: number): void {
    const mouseMovement = Input.instance.flushMouseMovement();

    const mouseSensitivity = 0.001;

    this.transform.setRotation(
      this.transform
        .getRotation()
        .rotate(new Vector(0, 1, 0), -mouseMovement[0] * mouseSensitivity)
    );
    this.camera.rotation.x -= mouseMovement[1] * mouseSensitivity;

    const cameraWalkingBob = Math.sin(
      (this.footStepInterval / 50) * 2 * Math.PI
    );
    this.camera.position.y = 0.95 + cameraWalkingBob * 0.06;
  }

  spawnBlackThing(): void {
    const blackThing = new BlackThing();
    const position = this.transform
      .getPosition()
      .add(
        new Vector(Math.random() * 2 - 1, 0, Math.random() * 2 - 1)
          .normalize()
          .scale(20)
      );
    this.world.addEntity(blackThing);
    blackThing.transform.setPosition(position);
  }

  camera: THREE.PerspectiveCamera;
  onInitGraphics(): void {
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.world.renderer.camera = camera;

    camera.position.y = 0.8;

    this.container.add(camera);

    this.camera = camera;

    const flashContainer = new THREE.Group();

    const flashLight = new THREE.SpotLight(
      0xccffee,
      0,
      0,
      Math.PI / 10,
      0.56,
      2.3
    );

    const target = new THREE.Object3D();
    flashContainer.add(target);
    flashContainer.add(flashLight);
    flashLight.target = target;
    this.camera.add(flashContainer);

    target.position.set(0, 0, -10);

    flashContainer.position.set(0, -0.5, 0);

    this.flashLight = flashLight;
  }

  flashLight: THREE.SpotLight;

  flashLightOn = false;

  sanity = 100;

  flashLightBattery = 1;

  footStepInterval = 0;

  distanceToSpawn = 0;
  checkDistanceToSpawnIn = 10;
  onUpdate(deltaTime: number) {
    this.checkDistanceToSpawnIn--;
    if (this.checkDistanceToSpawnIn <= 0) {
      this.distanceToSpawn = this.transform.getPosition().length() / 5;
      document.getElementById("distanceTraveled").innerText = `${Math.round(
        this.distanceToSpawn
      )}m`;
    }

    if (this.footStepInterval <= 0) {
      playSound("FootStep");
      this.footStepInterval = 50;
    }

    const newButtons = this.keyboardController.newKeys;

    if (newButtons.has("KeyF")) {
      this.flashLightOn = !this.flashLightOn;

      this.flashLight.intensity = this.flashLightOn ? 60 : 0;

      playSound("FlashLight");
      showFlashLightUI();
    }

    if (this.flashLightOn) {
      this.flashLightBattery -= deltaTime / 1000 / 60;

      if (this.flashLightBattery <= 0) {
        this.flashLightOn = false;
        this.flashLight.intensity = 0;
      }
      setFlashLightLevel(Math.ceil(this.flashLightBattery * 4));
    }

    const horizontal = this.keyboardController.getAxis("Horizontal");
    const vertical = -this.keyboardController.getAxis("Vertical");
    let movement = new Vector(horizontal, 0, vertical).normalize();

    // Rotate movement vector to the player's rotation along the y-axis
    const forward = this.transform.getRotation().forward();

    movement = movement.rotate(new Vector(0, 1, 0), forward.angle());

    const maxSpeed = 5;
    const maxVelocity = movement.scale(maxSpeed);
    const currentVelocity = toVector(this.body.linvel());
    const acceleration = 0.2;
    const velocityDelta = maxVelocity.add(currentVelocity.inverse());
    const velocityChange = velocityDelta.scale(acceleration);
    const newVelocity = currentVelocity.add(velocityChange);

    const newTranslation = newVelocity.scale(deltaTime / 1000);

    if (currentVelocity.length() > 0) {
      const currentHorizontalVelocity = new Vector(
        currentVelocity.x,
        0,
        currentVelocity.z
      );

      this.footStepInterval -= currentHorizontalVelocity.length() * 0.2;
    }

    // gravity
    newTranslation.y -= (9.8 * deltaTime) / 1000;

    this.desiredTranslation = newTranslation;

    if (this.distanceToSpawn > 50) {
      const blackThings = this.world.getEntitiesWithTag("blackThing");

      if (blackThings.length < 3) {
        this.spawnBlackThing();
      }
    }

    super.onUpdate(deltaTime);
    this.keyboardController.flushNewKeys();
  }
}
