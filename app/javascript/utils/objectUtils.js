// simple way to detect if prop changes warrant re-initializing
export const objectsEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b)

export default {
  objectsEqual,
}
