import v, {
  EVENT_SOURCE_TYPES,
  POPOUT_MENU_OFFSET_MAP,
} from '~/utils/variables'

// returns position to move popout menu dynamically
// params: e, click event used to get cursor position
// eventSource: where the click happened, used to get component dimensions
// popoutMenuItemCount: menu item count used to determine menu height
const calculatePopoutMenuOffset = (e, eventSource, popoutMenuItemCount) => {
  const { actionMenuWidth, actionMenuHeight } = v
  const { clientX, clientY } = e
  const { innerWidth, innerHeight } = window
  let totalHeight
  let totalWidth
  let menuBoundaryXMin
  let menuBoundaryXMax
  let menuBoundaryYMin
  let menuBoundaryYMax

  // todo: add pageMenu, orgMenu, etc. if necessary
  switch (eventSource) {
    case EVENT_SOURCE_TYPES.GRID_CARD:
      totalWidth = actionMenuWidth
      totalHeight = actionMenuHeight * popoutMenuItemCount
      menuBoundaryXMin = clientX
      menuBoundaryXMax = innerWidth - actionMenuWidth
      menuBoundaryYMin = 60 + clientY + totalHeight
      menuBoundaryYMax = innerHeight
      break
    case EVENT_SOURCE_TYPES.AUDIENCE_SETTINGS:
      totalWidth = actionMenuWidth
      totalHeight = actionMenuHeight * popoutMenuItemCount
      menuBoundaryXMin = clientX + actionMenuWidth
      menuBoundaryXMax = innerWidth
      menuBoundaryYMin = 60 + clientY + totalHeight
      menuBoundaryYMax = innerHeight
    default:
      break
  }

  const componentOffsets = POPOUT_MENU_OFFSET_MAP[eventSource]
  const { x, y } = componentOffsets
  const leftOffset = totalWidth - x
  const rightOffset = -x
  const topOffset = -totalHeight - y
  const bottomOffset = 0

  // if click happens outside menu boundary, then move component
  if (
    menuBoundaryXMin > menuBoundaryXMax &&
    menuBoundaryYMin < menuBoundaryYMax
  ) {
    // bottom left of the cursor
    return { offsetX: leftOffset, offsetY: bottomOffset }
  } else if (
    menuBoundaryXMin < menuBoundaryXMax &&
    menuBoundaryYMin < menuBoundaryYMax
  ) {
    // bottom right of the cursor
    return { offsetX: rightOffset, offsetY: bottomOffset }
  } else if (
    menuBoundaryXMin > menuBoundaryXMax &&
    menuBoundaryYMin > menuBoundaryYMax
  ) {
    // top left of the cursor
    return { offsetX: leftOffset, offsetY: topOffset }
  } else {
    // top right of the cursor
    return { offsetX: rightOffset, offsetY: topOffset }
  }
}

export { calculatePopoutMenuOffset }
