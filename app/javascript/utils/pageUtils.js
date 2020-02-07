import v from '~/utils/variables'

const calculateFullWidthPageMargins = () => {
  let xMargin
  if (window.innerWidth >= v.maxWidth) {
    xMargin = (window.innerWidth - v.maxWidth) / 2
  } else {
    // Otherwise use container padding, multiplied to transform to px
    xMargin = v.containerPadding.horizontal * 16
  }
  return {
    x: xMargin,
    y: v.topScrollTrigger,
  }
}

export { calculateFullWidthPageMargins }
