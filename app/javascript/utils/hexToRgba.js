import hexRgb from 'hex-rgb'

export default function hexToRgba(hex, alpha = 1) {
  const rgb = hexRgb(hex, { format: 'array' })
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
}
