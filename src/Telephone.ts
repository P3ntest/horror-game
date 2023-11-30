import { Scene } from "./Scene";
import { NonPhysicalEntity } from "./engine/Entity";

const RING_INTERVAL = 3.5;

function nextRingRandom() {
  const min = 10;
  const max = 60;

  return Math.random() * (max - min) + min;
}

export class Telephone extends NonPhysicalEntity {
  nextRing = nextRingRandom();
  rings = 0;

  isRinging = false;

  currentRingAudio: HTMLAudioElement;

  onUpdate(deltaTime: number, currentTick: number): void {
    const scene = this.world.requireEntityById("scene") as Scene;

    const deltaSeconds = deltaTime / 1000;

    if (scene.lightsAreOn) {
      this.nextRing -= deltaSeconds;

      if (this.nextRing <= 0) {
        const audio = new Audio("assets/telephone.wav");
        audio.volume = 0.04;
        audio.play();
        this.currentRingAudio = audio;
        this.isRinging = true;
        this.rings++;
        if (this.rings < 5) {
          this.nextRing = RING_INTERVAL;
        } else {
          this.isRinging = false;
          this.nextRing = nextRingRandom();
          this.rings = 0;
        }
      }
    } else {
      this.rings = 0;
      this.nextRing = nextRingRandom();
      this.isRinging = false;
      if (this.currentRingAudio) {
        this.currentRingAudio.pause();
      }
    }
  }
}
