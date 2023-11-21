import RAPIER from "@dimforge/rapier3d";

import * as THREE from "three";

export class Vector {
  constructor(public x: number, public y: number, public z: number) {}

  static get ZERO() {
    return new Vector(0, 0, 0);
  }

  clone() {
    return new Vector(this.x, this.y, this.z);
  }

  scale(scalar: number | Vector) {
    if (scalar instanceof Vector) {
      return new Vector(
        this.x * scalar.x,
        this.y * scalar.y,
        this.z * scalar.z
      );
    }
    return new Vector(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  add(other: Vector) {
    return new Vector(this.x + other.x, this.y + other.y, this.z + other.z);
  }

  subtract(other: Vector) {
    return new Vector(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  inverse() {
    return new Vector(-this.x, -this.y, -this.z);
  }

  normalize() {
    const length = this.length();
    if (length === 0) {
      return Vector.ZERO;
    }
    return new Vector(this.x / length, this.y / length, this.z / length);
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  rotate(axis: Vector, angle: number) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const dot = this.dot(axis);
    const cross = this.cross(axis);
    return this.scale(cos)
      .add(cross.scale(sin))
      .add(axis.scale(dot * (1 - cos)));
  }

  dot(other: Vector) {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  cross(other: Vector) {
    return new Vector(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x
    );
  }

  angle() {
    return Math.atan2(this.x, this.z);
  }

  get 0() {
    return this.x;
  }

  get 1() {
    return this.y;
  }

  get 2() {
    return this.z;
  }

  [Symbol.iterator]() {
    return [this.x, this.y, this.z][Symbol.iterator]();
  }
}

export class Quaternion {
  constructor(
    public x: number,
    public y: number,
    public z: number,
    public w: number
  ) {}

  static get IDENTITY() {
    return new Quaternion(0, 0, 0, 1);
  }

  static fromAxisAngle(axis: Vector, angle: number) {
    const halfAngle = angle / 2;
    const sin = Math.sin(halfAngle);
    const cos = Math.cos(halfAngle);
    return new Quaternion(
      axis.x * sin,
      axis.y * sin,
      axis.z * sin,
      cos
    ).normalize();
  }

  normalize() {
    const length = this.length();
    if (length === 0) {
      return Quaternion.IDENTITY;
    }
    return new Quaternion(
      this.x / length,
      this.y / length,
      this.z / length,
      this.w / length
    );
  }

  toEuler() {
    const sinr_cosp = 2 * (this.w * this.x + this.y * this.z);
    const cosr_cosp = 1 - 2 * (this.x * this.x + this.y * this.y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    const sinp = 2 * (this.w * this.y - this.z * this.x);
    let pitch;
    if (Math.abs(sinp) >= 1) {
      pitch = (Math.sign(sinp) * Math.PI) / 2;
    } else {
      pitch = Math.asin(sinp);
    }

    const siny_cosp = 2 * (this.w * this.z + this.x * this.y);
    const cosy_cosp = 1 - 2 * (this.y * this.y + this.z * this.z);
    let yaw = Math.atan2(siny_cosp, cosy_cosp);

    // Adjust yaw to be -π when looking backward
    if (Math.abs(yaw) < 0.0001) {
      yaw = -Math.PI;
    }

    return new Vector(roll, pitch, yaw);
  }

  length() {
    return Math.sqrt(
      this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w
    );
  }

  static fromRapier(rotation: RAPIER.Rotation) {
    return new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
  }

  toThree() {
    return new THREE.Quaternion(this.x, this.y, this.z, this.w);
  }

  //rotate along axis
  rotate(axis: Vector, angle: number) {
    return Quaternion.fromAxisAngle(axis, angle).multiply(this);
  }

  angle() {
    return 2 * Math.acos(this.w);
  }

  static random() {
    return Quaternion.fromAxisAngle(
      new Vector(Math.random(), Math.random(), Math.random()),
      Math.random() * Math.PI * 2
    );
  }

  forward(): Vector {
    // Calculate the forward direction based on the character's orientation
    const quaternion = this.normalize();
    const forward = new Vector(
      2 * (quaternion.x * quaternion.z - quaternion.w * quaternion.y),
      2 * (quaternion.y * quaternion.z + quaternion.w * quaternion.x),
      1 - 2 * (quaternion.x * quaternion.x + quaternion.y * quaternion.y)
    );

    return forward;
  }

  multiply(other: Quaternion) {
    return new Quaternion(
      this.w * other.x + this.x * other.w + this.y * other.z - this.z * other.y,
      this.w * other.y - this.x * other.z + this.y * other.w + this.z * other.x,
      this.w * other.z + this.x * other.y - this.y * other.x + this.z * other.w,
      this.w * other.w - this.x * other.x - this.y * other.y - this.z * other.z
    );
  }
}
