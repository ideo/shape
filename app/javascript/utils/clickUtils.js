import v, {
  EVENT_SOURCE_TYPES,
  POPOUT_MENU_TRANSLATE_MAP,
} from '~/utils/variables'

// returns position to move popout menu dynamically
// params: e, click event used to get cursor position
// eventSource: where the click happened, used to get component dimensions
// popoutMenuItemCount: menu item count used to determine menu height
const calculatePopoutMenuOffset = (e, eventSource, popoutMenuItemCount) => {
  const { actionMenuWidth, actionMenuHeight } = v
  const { clientX, clientY } = e
  const { innerWidth, innerHeight } = window
  let menuBoundaryXMin
  let menuBoundaryXMax
  let menuBoundaryYMin
  let menuBoundaryYMax

  // todo: add pageMenu, orgMenu, etc. if necessary
  switch (eventSource) {
    case EVENT_SOURCE_TYPES.GRID_CARD:
      menuBoundaryXMin = clientX
      menuBoundaryXMax = innerWidth - actionMenuWidth
      menuBoundaryYMin = 60 + clientY + actionMenuHeight * popoutMenuItemCount
      menuBoundaryYMax = innerHeight
      break
    default:
      break
  }

  const translateComponent = POPOUT_MENU_TRANSLATE_MAP[eventSource]

  // if click happens outside menu boundary, then move component
  if (
    menuBoundaryXMin < menuBoundaryXMax &&
    menuBoundaryYMin < menuBoundaryYMax
  ) {
    // moves bottom left of the cursor
    const { bottomLeft } = translateComponent
    const { x, y } = bottomLeft
    return { offsetX: x, offsetY: y }
  } else if (
    menuBoundaryXMin > menuBoundaryXMax &&
    menuBoundaryYMin < menuBoundaryYMax
  ) {
    // moves bottom right of the cursor
    const { bottomRight } = translateComponent
    const { x, y } = bottomRight
    const offsetX = -20 + x
    return { offsetX: offsetX, offsetY: y }
  } else if (
    menuBoundaryXMin < menuBoundaryXMax &&
    menuBoundaryYMin > menuBoundaryYMax
  ) {
    // moves component top right of the cursor
    const { topLeft } = translateComponent
    const { x, y } = topLeft
    const offsetX = -20 + x // -20 aligns width with mouse pos
    const offsetY = 60 + y * popoutMenuItemCount // 60 aligns width with mouse pos
    return { offsetX: offsetX, offsetY: offsetY }
  } else {
    // moves component top right of the cursor
    const { topRight } = translateComponent
    const { x, y } = topRight
    const offsetX = -20 + x // -20 aligns width with mouse pos
    const offsetY = 60 + y * popoutMenuItemCount // 60 aligns width with mouse pos
    return { offsetX: offsetX, offsetY: offsetY }
  }
}

export { calculatePopoutMenuOffset }
