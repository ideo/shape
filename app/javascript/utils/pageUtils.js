import v from '~/utils/variables'

const calculatePageMargins = ({ fullWidth = true } = {}) => {
  let x
  if (fullWidth && window.innerWidth >= v.maxWidth) {
    x = (window.innerWidth - v.maxWidth) / 2
  } else {
    // Otherwise use container padding, multiplied to transform to px
    x = v.containerPadding.horizontal * 16
  }
  const y = v.topScrollTrigger
  return {
    x,
    y,
    left: x,
    top: y,
  }
}

export { calculatePageMargins }
