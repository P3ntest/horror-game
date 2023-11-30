import { ColliderDesc } from "@dimforge/rapier3d";
import { CharacterEntity } from "./engine/CharacterEntity";
import { Physics, toVector } from "./engine/PhysicsEngine";
import { KeyboardController } from "./engine/util/KeyboardController";
import { Vector } from "./engine/util/vector";
import { Input } from "./engine/util/Input";
import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { int, transformedNormalView } from "three/examples/jsm/nodes/Nodes.js";
import { playSound } from "./sound";
import { setFlashLightLevel, showFlashLightUI } from "./uiUtils";
import { BlackThing } from "./BlackThing";
import { Scene } from "./Scene";
import { getSettingsForSanity } from "./sanity";

let mouseSensitivityMultiplier = parseFloat(
  localStorage.getItem("mouseSensitivity") ?? "1"
);

window["mouseSensitivity"] = (sens) => {
  localStorage.setItem("mouseSensitivity", sens);
  mouseSensitivityMultiplier = sens;
};

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

    const mouseSensitivity = 0.002 * mouseSensitivityMultiplier;

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

    const cameraPosition = this.camera.getWorldPosition(new THREE.Vector3());
    this.flashContainer.position.set(
      cameraPosition.x,
      cameraPosition.y - 1,
      cameraPosition.z
    );

    const desiredRotation = this.camera.getWorldQuaternion(
      new THREE.Quaternion()
    );

    const currentRotation = this.flashContainer.quaternion;

    // we have two quaternions, we want to rotate currentRotation to desiredRotation by a small amount depending on the distance. so if its close we rotate a bit, if its far we rotate a lot

    const rotationDelta = currentRotation.slerp(desiredRotation, 0.1);

    this.flashContainer.setRotationFromQuaternion(rotationDelta);
  }

  spawnBlackThing(): void {
    const DISTANCE = 25;

    const blackThing = new BlackThing();
    const position = this.transform
      .getPosition()
      .add(
        new Vector(Math.random() * 2 - 1, 0, Math.random() * 2 - 1)
          .normalize()
          .scale(DISTANCE)
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
      Math.PI / 8,
      0.56,
      2
    );

    const target = new THREE.Object3D();
    flashContainer.add(target);
    flashContainer.add(flashLight);
    flashLight.target = target;
    this.flashContainer = flashContainer;
    this.world.renderer.scene.add(flashContainer);

    target.position.set(0, 0, -10);

    flashContainer.position.set(0, 0, 0);

    this.flashLight = flashLight;
  }

  flashLight: THREE.SpotLight;
  flashContainer: THREE.Group;

  flashLightOn = false;

  insanity = 0; // increases, technically "insanity"

  flashLightBattery = 1;

  footStepInterval = 0;

  distanceToSpawn = 0;
  checkDistanceToSpawnIn = 10;

  targetedMeshes: THREE.Object3D[] = [];

  balls: THREE.Mesh[] = [];

  updateFlashLightLevel() {
    setFlashLightLevel(Math.ceil(this.flashLightBattery * 4));
  }

  get difficulty() {
    return getSettingsForSanity(this.insanity);
  }

  onUpdate(deltaTime: number) {
    const newButtons = this.keyboardController.newKeys;

    if (!this.killed) {
      this.updateLookingAtIntersections();
      this.updateDistanceTraveledUI();
      this.handleFootsteps();

      if (newButtons.has("KeyF")) {
        this.handleToggleFlashLight();
      }

      this.handleFlashLightUpdate(deltaTime);
      this.updateSanity(deltaTime);
      this.handleSpawnBlackThings();
    }

    // if (newButtons.has("KeyE")) {
    //   this.kill();
    // }

    this.handleMovement(deltaTime);

    super.onUpdate(deltaTime);
    this.keyboardController.flushNewKeys();
  }

  killed = false;
  private handleSpawnBlackThings() {
    const scene = this.world.requireEntityById("scene") as Scene;
    if (!scene.lightsAreOn) {
      const blackThings = this.world.getEntitiesWithTag("blackThing");

      if (blackThings.length < this.difficulty.blackThings) {
        this.spawnBlackThing();
      }
    }
  }

  private updateSanity(deltaTime: number) {
    const scene = this.world.requireEntityById("scene") as Scene;
    if (scene.lightsAreOn) {
      this.insanity -= (deltaTime / 1000 / 60) * 0.4;
    } else {
      if (this.flashLightOn) {
        this.insanity += (deltaTime / 1000 / 60) * 1.4;
      } else {
        this.insanity += (deltaTime / 1000 / 60) * 5;
      }
    }
    this.insanity = Math.max(0, this.insanity);
  }

  private handleMovement(deltaTime: number) {
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
  }

  private handleFlashLightUpdate(deltaTime: number) {
    if (this.flashLightOn) {
      this.flashLightBattery -= deltaTime / 1000 / 60;
      this.updateFlashLightLevel();

      if (this.flashLightBattery <= 0) {
        this.flashLightOn = false;
        this.flashLight.intensity = 0;
      }
    }
  }

  private handleToggleFlashLight() {
    this.flashLightOn = !this.flashLightOn;

    this.flashLight.intensity = this.flashLightOn ? 100 : 0;

    playSound("FlashLight");
    showFlashLightUI();
  }

  private handleFootsteps() {
    if (this.footStepInterval <= 0) {
      playSound("FootStep");
      this.footStepInterval = 50;
    }
  }

  private updateDistanceTraveledUI() {
    this.checkDistanceToSpawnIn--;
    if (this.checkDistanceToSpawnIn <= 0) {
      this.distanceToSpawn = this.transform.getPosition().length() / 4;
      document.getElementById("distanceTraveled").innerText = `${Math.round(
        this.distanceToSpawn
      )}m`;
    }
  }

  private updateLookingAtIntersections() {
    const ray = new THREE.Raycaster(
      this.camera.getWorldPosition(new THREE.Vector3()),
      this.camera.getWorldDirection(new THREE.Vector3()),
      0,
      2.5
    );

    const intersections = ray.intersectObjects(
      this.world.renderer.scene.children,
      true
    );

    this.targetedMeshes = intersections.map(
      (intersection) => intersection.object
    );
  }

  kill() {
    if (this.killed) return;
    // glitch out of the world
    this.killed = true;
    this.transform.setPosition(
      new Vector(
        this.transform.getPosition().x,
        this.transform.getPosition().y - 2,
        this.transform.getPosition().z
      )
    );

    const diedSoundAmbient = new Audio("assets/diedambient.wav");
    diedSoundAmbient.volume = 0.4;
    diedSoundAmbient.play();

    const diedSound = new Audio("assets/died.wav");
    diedSound.volume = 1;
    diedSound.play();
  }
}
