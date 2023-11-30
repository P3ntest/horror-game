export function getSettingsForSanity(insanity: number) {
  // sanity is a number that increases from 0

  return {
    // the number of black things that spawn,
    blackThings: Math.max(0, Math.round((insanity - 0.3) * 3)),
    wallSpeed: insanity > 1 ? 1 : 0,
    floorSpeed: insanity > 2 ? 1 : 0,
    ceilingSpeed: insanity > 3 ? 1 : 0,
    blackThingsSpeedMultiplier: insanity * 0.5,
  };
}
