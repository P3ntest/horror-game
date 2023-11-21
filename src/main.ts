import { Sheep } from "./Passive";
import { Player } from "./Player";
import { Scene } from "./Scene";
import { Physics, PhysicsEntity } from "./engine/PhysicsEngine";
import { World } from "./engine/World";
import { Quaternion, Vector } from "./engine/util/vector";
import * as THREE from "three";
import "./style/index.css";
import { BlackThing } from "./BlackThing";

const world = new World();

const player = new Player();
world.addEntity(player, "player");
player.transform.setPosition(new Vector(0, 2, 0));

const scene = new Scene();
world.addEntity(scene);
scene.transform.setPosition(new Vector(0, -4.5, 0));
