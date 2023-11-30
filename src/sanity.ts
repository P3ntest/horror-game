export function getSettingsForSanity(insanity: number) {
  // sanity is a number that increases from 0

  return {
    // the number of black things that spawn,
    blackThings: Math.max(0, Math.round((insanity - 1) * 3)),
    wallSpeed: insanity > 2 ? 1 : 0,
  };
}
