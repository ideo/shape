/*
 * The following code was taken from the hex-rgb library.
 * It's here because it doesn't transpile it's template strings, therefore
 * will break in Internet Explorer 11.
 *
 * https://github.com/sindresorhus/hex-rgb
 */

const hexChars = 'a-f\\d'
const match3or4Hex = `#?[${hexChars}]{3}[${hexChars}]?`
const match6or8Hex = `#?[${hexChars}]{6}([${hexChars}]{2})?`

const nonHexChars = new RegExp(`[^#${hexChars}]`, 'gi')
const validHexSize = new RegExp(`^${match3or4Hex}$|^${match6or8Hex}$`, 'i')

function hexRgb(hexStr, options = {}) {
  let hex = hexStr
  if (
    typeof hex !== 'string' ||
    nonHexChars.test(hex) ||
    !validHexSize.test(hex)
  ) {
    throw new TypeError('Expected a valid hex string')
  }

  hex = hex.replace(/^#/, '')
  let alpha = 255

  if (hex.length === 8) {
    alpha = parseInt(hex.slice(6, 8), 16) / 255
    hex = hex.substring(0, 6)
  }

  if (hex.length === 4) {
    alpha = parseInt(hex.slice(3, 4).repeat(2), 16) / 255
    hex = hex.substring(0, 3)
  }

  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }

  const num = parseInt(hex, 16)
  /* eslint-disable no-bitwise */
  const red = num >> 16
  const green = (num >> 8) & 255
  const blue = num & 255
  /* eslint-enable no-bitwise */

  return options.format === 'array'
    ? [red, green, blue, alpha]
    : { red, green, blue, alpha }
}

export default function hexToRgba(hex, alpha = 1) {
  const rgb = hexRgb(hex, { format: 'array' })
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
}
