export async function prepareDevices(
  camera: boolean,
  voice: boolean,
  _isCurrent?: () => boolean,
) {
  return { camera, voice, note: "" };
}
