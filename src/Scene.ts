import { NonPhysicalEntity } from "./engine/Entity";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import * as THREE from "three";
import { PhysicsEntity } from "./engine/PhysicsEngine";
import { ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d";
import { Vector } from "./engine/util/vector";
import { showFlashLightUI } from "./uiUtils";
import { Breaker } from "./Breaker";
import { Player } from "./Player";
import { distance } from "three/examples/jsm/nodes/Nodes.js";

const textureLoader = new THREE.TextureLoader();

const floorTexture = textureLoader.load("assets/carpet.jpg");
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(1, 1);

const ROOM_SIZE = 10;

const WALL_THICKNESS = 0.1;

const ROOM_HEIGHT = 3.5;

const wallTexture = textureLoader.load("assets/wall.jpg");
wallTexture.wrapS = THREE.RepeatWrapping;
wallTexture.wrapT = THREE.RepeatWrapping;
wallTexture.repeat.set(0.5, 0.5);

const roofTexture = textureLoader.load("assets/roof.jpg");
roofTexture.wrapS = THREE.RepeatWrapping;
roofTexture.wrapT = THREE.RepeatWrapping;

const LIGHT_ON_INTENSITY = 0.8;

const LIGHTS_VOLUME = 0.04;

export class Scene extends NonPhysicalEntity {
  onInitGraphics(): void {
    const ambient = new THREE.AmbientLight(0xffffdd, LIGHT_ON_INTENSITY);
    this.container.add(ambient);
    this.light = ambient;
  }

  rooms: Map<string, Room> = new Map();

  onRender(tick: number): void {}

  lightsAreOn: boolean = true;
  lightsChangeTick: number = Infinity;
  light: THREE.AmbientLight;

  lightsAmbientAudio: HTMLAudioElement;

  onAdd(): void {
    super.onAdd();

    this.generateRoom(0, 0, false);

    const audio = new Audio("assets/light_ambient.mp3");
    audio.loop = true;
    audio.volume = LIGHTS_VOLUME;
    audio.play();
    this.lightsAmbientAudio = audio;
  }

  onUpdate(deltaTime: number, tick: number): void {
    this.lightsAmbientAudio.play();
    const player = this.world.requireEntityById("player") as Player;

    const playerPosition = player.transform.getPosition();

    // procedural generation
    const GENERATION_DISTANCE = 10;

    const playerRoomX = Math.floor(playerPosition.x / ROOM_SIZE);
    const playerRoomZ = Math.floor(playerPosition.z / ROOM_SIZE);

    for (let x = -GENERATION_DISTANCE; x < GENERATION_DISTANCE; x++) {
      for (let z = -GENERATION_DISTANCE; z < GENERATION_DISTANCE; z++) {
        const roomX = playerRoomX + x;
        const roomZ = playerRoomZ + z;

        if (!this.rooms.has(`${roomX},${roomZ}`)) {
          this.generateRoom(roomX, roomZ, roomX !== 0 || roomZ !== 0);
        }
      }
    }

    //remove rooms that are too far away
    const REMOVE_DISTANCE = 10; //;
    for (const room of this.rooms.values()) {
      const distanceX = Math.abs(room.x - playerRoomX);
      const distanceZ = Math.abs(room.y - playerRoomZ);
      if (distanceX > REMOVE_DISTANCE || distanceZ > REMOVE_DISTANCE) {
        this.world.removeEntity(room);
        this.rooms.delete(room.id);
      }
    }

    if (player.distanceToSpawn > 20) {
      if (this.lightsChangeTick === Infinity) {
        this.lightsChangeTick = tick + 100 + Math.random() * 500;
      }
    }

    if (tick > this.lightsChangeTick) {
      this.lightsAreOn = !this.lightsAreOn;

      this.world.renderer.scene.background = new THREE.Color(
        this.lightsAreOn ? 0x67683d : 0x000000
      );

      this.light.intensity = this.lightsAreOn ? LIGHT_ON_INTENSITY : 0.001;

      this.lightsChangeTick = tick + 500 + Math.random() * 500;
      showFlashLightUI();

      this.lightsAmbientAudio.volume = this.lightsAreOn ? LIGHTS_VOLUME : 0;
    }

    wallTexture.offset.y += 0.001 * player.difficulty.wallSpeed;
    floorTexture.offset.y += 0.001 * player.difficulty.floorSpeed;
    floorTexture.offset.x += 0.001 * player.difficulty.floorSpeed;
    roofTexture.offset.y += 0.001 * player.difficulty.ceilingSpeed;
    roofTexture.offset.x += 0.001 * player.difficulty.ceilingSpeed;
  }

  generateRoom(x: number, y: number, generateWalls = true) {
    const room = new Room(x, y, generateWalls);
    this.world.addEntity(room);
    room.transform.setPosition(new Vector(x * ROOM_SIZE, 0, y * ROOM_SIZE));
    this.rooms.set(room.id, room);
    room.generateBreaker();
  }
}

class Room extends PhysicsEntity {
  constructor(public x: number, public y: number, public generateWalls = true) {
    super();
    this.walls = generateWalls
      ? (new Array(4).fill(0).map(() => Math.random() > 0.4) as [
          boolean,
          boolean,
          boolean,
          boolean
        ])
      : [false, false, false, false];
  }

  get id() {
    return `${this.x},${this.y}`;
  }

  breaker: Breaker | null = null;

  generateBreaker() {
    const distanceFromSpawn = Math.sqrt(this.x ** 2 + this.y ** 2) * ROOM_SIZE;
    if (this.walls[1] && Math.random() > 0.9 && distanceFromSpawn > 20) {
      const breaker = new Breaker();
      this.world.addEntity(breaker);
      breaker.transform.setPosition(
        this.transform
          .getPosition()
          .add(new Vector(ROOM_SIZE / 4, ROOM_HEIGHT / 2, 0.1))
      );
      this.breaker = breaker;
    }
  }

  onRemove(): void {
    super.onRemove();
    if (this.breaker) {
      this.breaker.onRemove();
    }
  }

  walls: [boolean, boolean, boolean, boolean];

  getBodyDesc(): RigidBodyDesc {
    return RigidBodyDesc.fixed();
  }
  textureLoader = new THREE.TextureLoader();

  createColliders(): ColliderDesc[] {
    const colliders = [ColliderDesc.cuboid(ROOM_SIZE / 2, 0.01, ROOM_SIZE / 2)]; //floor

    this.walls.forEach((wall, i) => {
      if (wall) {
        const thicknessX = i % 2 === 0 ? WALL_THICKNESS : ROOM_SIZE / 2;
        const thicknessZ = i % 2 === 1 ? WALL_THICKNESS : ROOM_SIZE / 2;

        const collider = ColliderDesc.cuboid(
          thicknessX / 2,
          ROOM_HEIGHT / 2,
          thicknessZ / 2
        );

        const posX = i % 2 === 0 ? 0 : i === 1 ? ROOM_SIZE / 4 : -ROOM_SIZE / 4;
        const posZ = i % 2 === 1 ? 0 : i === 0 ? ROOM_SIZE / 4 : -ROOM_SIZE / 4;

        collider.setTranslation(posX, ROOM_HEIGHT / 2, posZ);
        colliders.push(collider);
      }
    });

    return colliders;
  }

  onInitGraphics(): void {
    const floorMaterial = new THREE.MeshLambertMaterial({
      map: floorTexture,
      side: THREE.DoubleSide,
    });

    const floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE),
      floorMaterial
    );

    // floorMesh.receiveShadow = true;

    floorMesh.rotation.x = Math.PI / 2;

    this.container.add(floorMesh);

    const roofMaterial = new THREE.MeshLambertMaterial({
      map: roofTexture,
    });

    const roofMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE),
      roofMaterial
    );

    // roofMesh.receiveShadow = true;

    roofMesh.rotation.x = Math.PI / 2;

    roofMesh.position.y = ROOM_HEIGHT;

    this.container.add(roofMesh);

    // for (const x of [-1, 1]) {
    //   for (const y of [-1, 1]) {
    //     if (Math.random() > 0.1) continue;

    //     const light = new THREE.PointLight(0xffff00, 3, 10);

    //     light.position.x = (x * ROOM_SIZE) / 4;

    //     light.position.z = (y * ROOM_SIZE) / 4;

    //     light.position.y = ROOM_HEIGHT - 0.5;

    //     this.container.add(light);

    //     const lamp = new THREE.Mesh(
    //       new THREE.BoxGeometry(0.5, 0.2, 0.5),
    //       new THREE.MeshLambertMaterial({
    //         color: 0xffff00,
    //       })
    //     );

    //     lamp.position.x = (x * ROOM_SIZE) / 4;
    //     lamp.position.z = (y * ROOM_SIZE) / 4;
    //     lamp.position.y = ROOM_HEIGHT;

    //     this.container.add(lamp);
    //   }
    // }

    const wallMaterial = new THREE.MeshLambertMaterial({
      map: wallTexture,
      side: THREE.DoubleSide,
    });

    this.walls.forEach((wall, i) => {
      if (wall) {
        const thicknessX = i % 2 === 0 ? WALL_THICKNESS : ROOM_SIZE / 2;
        const thicknessZ = i % 2 === 1 ? WALL_THICKNESS : ROOM_SIZE / 2;
        const posX = i % 2 === 0 ? 0 : i === 1 ? ROOM_SIZE / 4 : -ROOM_SIZE / 4;
        const posZ = i % 2 === 1 ? 0 : i === 0 ? ROOM_SIZE / 4 : -ROOM_SIZE / 4;

        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(thicknessX, ROOM_HEIGHT, thicknessZ),
          wallMaterial
        );

        // mesh.castShadow = true;

        mesh.position.x = posX;
        mesh.position.z = posZ;
        mesh.position.y = ROOM_HEIGHT / 2;

        this.container.add(mesh);
      }
    });
  }

  doesMove: boolean = Math.random() > 0.5;

  onRender(tick: number): void {}
}
