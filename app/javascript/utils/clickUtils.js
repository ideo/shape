import v, {
  EVENT_SOURCE_TYPES,
  POPOUT_MENU_OFFSET_MAP,
} from '~/utils/variables'

// returns position to move popout menu dynamically
// params: e, click event used to get cursor position
// eventSource: where the click happened, used to get component dimensions
// popoutMenuItemCount: menu item count used to determine menu height
const calculatePopoutMenuOffset = (e, eventSource, popoutMenuItemCount = 1) => {
  const { actionMenuWidth, actionMenuHeight } = v
  const { clientX, clientY } = e
  const { innerWidth, innerHeight } = window
  const totalWidth = actionMenuWidth
  const totalHeight = actionMenuHeight * popoutMenuItemCount
  // where component must not overlap
  const menuBoundaryXMin = clientX + actionMenuWidth
  const menuBoundaryYMin = 60 + clientY + totalHeight
  // where the component is and the area in the screen it covers
  const menuBoundaryXMax = innerWidth
  const menuBoundaryYMax = innerHeight

  // set offsets per component
  const componentOffsets = POPOUT_MENU_OFFSET_MAP[eventSource]
  const { x, y } = componentOffsets
  let leftOffset
  let rightOffset
  let topOffset
  let bottomOffset

  // todo: add pageMenu, orgMenu, bctMenu etc. if necessary since offsets may differ per component
  switch (eventSource) {
    case EVENT_SOURCE_TYPES.AUDIENCE_SETTINGS:
      const topOffsetMaxValue = -230 // never exceed click position
      leftOffset = totalWidth - x
      rightOffset = -x + 20
      topOffset =
        -totalHeight - y - 60 > topOffsetMaxValue
          ? -y - 20
          : -totalHeight - y - 60
      bottomOffset = -35
      break
    case EVENT_SOURCE_TYPES.GRID_CARD:
    default:
      leftOffset = totalWidth - x
      rightOffset = -x
      topOffset = -totalHeight - y
      bottomOffset = 0
      break
  }

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
