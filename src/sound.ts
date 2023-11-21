const Sounds = {
  FootStep: "assets/footstep.wav",
  FlashLight: "assets/flashlightclick.mp3",
  Collect: "assets/collect.wav",
};

const defaultVolume: { [key: string]: number } = {};

defaultVolume["FootStep"] = 1;
defaultVolume["FlashLight"] = 0.5;
defaultVolume["Collect"] = 0.5;

export function playSound(sound: keyof typeof Sounds, volume?: number) {
  volume = volume ?? defaultVolume[sound] ?? 0.1;
  const audio = new Audio(Sounds[sound]);
  audio.volume = volume;
  audio.play();
}
