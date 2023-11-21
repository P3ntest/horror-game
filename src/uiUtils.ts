export function showFlashLightUI() {
  const flashlight = document.getElementById("flashLightContainer");
  if (flashlight) {
    flashlight.style.display = "block";
  }
}

export function setFlashLightLevel(level: number) {
  // level is a number from 0 to 4
  // the component #flashLightEdge has 4 children, each of which is a div
  // the divs are ordered from least to most intense

  const flashlight = document.getElementById("flashLightEdge");

  if (!flashlight) {
    return;
  }

  const children = flashlight.children;

  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    if (i < level) {
      (child as HTMLElement).style.opacity = "1";
    } else {
      (child as HTMLElement).style.opacity = "0";
    }
  }
}

export function setShowPickupNote(show: boolean) {
  const note = document.getElementById("pickupNote");
  if (note) {
    note.style.opacity = show ? "1" : "0";
  }
}
