import v from '~/utils/variables'

const coverTextClamp = ({
  name: name,
  subtitle = '',
  windowWidth = null,
  cardHeight = null,
}) => {
  const textBreakpoints = [
    {
      desiredNameLen: 53,
      desiredContentLen: 90,
    },
    {
      breakpoint: v.responsive.smallBreakpoint,
      desiredNameLen: 46,
      desiredContentLen: 79,
    },
    {
      breakpoint: v.responsive.medBreakpoint,
      desiredNameLen: 35,
      desiredContentLen: 61,
    },
    {
      breakpoint: v.responsive.largeBreakpoint,
      desiredNameLen: 40,
      desiredContentLen: 80,
    },
  ]
  let { desiredNameLen, desiredContentLen } = textBreakpoints.reduce(
    (prev, i) => (i.breakpoint && windowWidth > i.breakpoint ? i : prev),
    textBreakpoints[0]
  )
  if (cardHeight > 1) {
    desiredNameLen *= 2
    desiredContentLen *= 2
  }
  let truncatedName = name || ''
  let truncatedContent = subtitle || ''
  if (name && name.length > desiredNameLen) {
    // In this case, the title will be over 3 lines, so don't display
    // any content and truncate the title somewhat in the middle
    truncatedContent = ''
    truncatedName = middleClamp(name, desiredNameLen)
  } else if (subtitle && subtitle.length > desiredContentLen) {
    truncatedContent = rightClamp(subtitle, desiredContentLen)
    truncatedName = name
  }
  return {
    truncatedName,
    truncatedContent,
  }
}

const middleClamp = (text, desiredTextLen) => {
  // In this case, the title will be over 3 lines, so don't display
  // any content and truncate the title somewhat in the middle
  const desiredLength = desiredTextLen - 2 // two extra chars for ellipsis and space
  const first = text.slice(0, desiredLength / 2)
  const second = text.slice(text.length - desiredLength / 2, text.length)
  return `${first}… ${second}`
}

const rightClamp = (text, desiredTextLen) => {
  const desiredLength = desiredTextLen - 1 // one extra char for ellipsis
  const first = text.slice(0, desiredLength)
  return `${first}…`
}

export { coverTextClamp, middleClamp, rightClamp }
