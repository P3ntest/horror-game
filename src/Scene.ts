import { NonPhysicalEntity } from "./engine/Entity";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import * as THREE from "three";
import { PhysicsEntity } from "./engine/PhysicsEngine";
import { ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d";
import { Vector } from "./engine/util/vector";
import { showFlashLightUI } from "./flashlight";
import { Breaker } from "./Breaker";

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
roofTexture.repeat.set(1, 1);

const LIGHT_ON_INTENSITY = 0.8;

export class Scene extends NonPhysicalEntity {
  onInitGraphics(): void {
    const ambient = new THREE.AmbientLight(0xffffdd, LIGHT_ON_INTENSITY);
    this.container.add(ambient);
    this.light = ambient;
  }

  rooms: Map<string, Room> = new Map();

  onRender(tick: number): void {}

  lightsAreOn: boolean = true;
  lightsChangeTick: number = 0;
  light: THREE.AmbientLight;

  onAdd(): void {
    super.onAdd();

    this.generateRoom(0, 0);
    this.lightsChangeTick = this.world.currentTick + 1000;
  }

  onUpdate(deltaTime: number, tick: number): void {
    const player = this.world.requireEntityById("player");

    const playerPosition = player.transform.getPosition();

    // procedural generation
    const GENERATION_DISTANCE = 8;

    const playerRoomX = Math.floor(playerPosition.x / ROOM_SIZE);
    const playerRoomZ = Math.floor(playerPosition.z / ROOM_SIZE);

    for (let x = -GENERATION_DISTANCE; x < GENERATION_DISTANCE; x++) {
      for (let z = -GENERATION_DISTANCE; z < GENERATION_DISTANCE; z++) {
        const roomX = playerRoomX + x;
        const roomZ = playerRoomZ + z;

        if (!this.rooms.has(`${roomX},${roomZ}`)) {
          this.generateRoom(roomX, roomZ);
        }
      }
    }

    // remove rooms that are too far away
    const REMOVE_DISTANCE = 12; //;
    for (const room of this.rooms.values()) {
      const distance = room.transform.getPosition().distanceTo(playerPosition);
      if (distance > REMOVE_DISTANCE * ROOM_SIZE) {
        this.world.removeEntity(room);
        const id = `${Math.floor(
          room.transform.getPosition().x / ROOM_SIZE
        )},${Math.floor(room.transform.getPosition().z / ROOM_SIZE)}`;

        this.rooms.delete(id);
      }
    }

    if (tick > this.lightsChangeTick) {
      this.lightsAreOn = !this.lightsAreOn;

      this.light.intensity = this.lightsAreOn ? LIGHT_ON_INTENSITY : 0.02;

      this.lightsChangeTick = tick + 500;
      showFlashLightUI();
    }
  }

  generateRoom(x: number, y: number) {
    const room = new Room();
    this.world.addEntity(room);
    room.transform.setPosition(new Vector(x * ROOM_SIZE, 0, y * ROOM_SIZE));
    this.rooms.set(`${x},${y}`, room);
    room.generateBreaker();
  }
}

class Room extends PhysicsEntity {
  constructor() {
    super();

    this.walls = new Array(4).fill(0).map(() => Math.random() > 0.4) as [
      boolean,
      boolean,
      boolean,
      boolean
    ];
  }

  generateBreaker() {
    if (this.walls[1] && Math.random() > 0.9) {
      const breaker = new Breaker();
      this.world.addEntity(breaker);
      breaker.transform.setPosition(
        this.transform
          .getPosition()
          .add(new Vector(ROOM_SIZE / 4, ROOM_HEIGHT / 2, 0.1))
      );
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

  onRender(tick: number): void {}
}
