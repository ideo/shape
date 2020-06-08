import v, {
  EVENT_SOURCE_TYPES,
  INITIAL_OFFSET_X,
  INITIAL_OFFSET_Y,
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
  let leftOffset
  let rightOffset
  let topOffset
  let bottomOffset

  // todo: add orgMenu, etc. if necessary since offsets may differ per component
  switch (eventSource) {
    case EVENT_SOURCE_TYPES.AUDIENCE_SETTINGS:
      const topOffsetMaxValue = -230 // never exceed click position
      leftOffset = totalWidth - INITIAL_OFFSET_X
      rightOffset = -INITIAL_OFFSET_X + 20
      topOffset =
        -totalHeight - INITIAL_OFFSET_Y - 60 > topOffsetMaxValue
          ? -INITIAL_OFFSET_Y - 20
          : -totalHeight - INITIAL_OFFSET_Y - 60
      bottomOffset = -35
      break
    case EVENT_SOURCE_TYPES.PAGE_MENU:
      leftOffset = totalWidth - INITIAL_OFFSET_X + 15
      rightOffset = -INITIAL_OFFSET_X + 20
      topOffset = -totalHeight - INITIAL_OFFSET_Y
      bottomOffset = 0
      break
    case EVENT_SOURCE_TYPES.BCT_MENU:
      leftOffset = -totalWidth + 20
      rightOffset = -INITIAL_OFFSET_X + 20
      topOffset = -totalHeight - INITIAL_OFFSET_Y
      bottomOffset = 0
      break
    case EVENT_SOURCE_TYPES.TEXT_EDITOR:
      leftOffset = totalWidth - INITIAL_OFFSET_X - INITIAL_OFFSET_X
      rightOffset = 20
      topOffset = -totalHeight - INITIAL_OFFSET_Y
      bottomOffset = -20
      break
    case EVENT_SOURCE_TYPES.GRID_CARD:
    default:
      leftOffset = totalWidth - INITIAL_OFFSET_X
      rightOffset = -INITIAL_OFFSET_X
      topOffset = -totalHeight - INITIAL_OFFSET_Y
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

export const openContextMenu = (
  ev,
  card,
  { targetRef, onOpenMenu, menuItemCount }
) => {
  let x = ev.clientX - 1600
  let y = ev.clientY - 360
  if (targetRef) {
    const rect = targetRef.getBoundingClientRect()
    x = ev.clientX - rect.left - rect.width
    y = ev.clientY - rect.top - 15
  }

  ev.persist()
  let delay = 0
  if (card.record.isText) {
    // delay so that contextMenu can determine whether you right-clicked and selected text
    delay = 200
  }
  setTimeout(() => {
    onOpenMenu(ev, { x, y, card, menuItemCount })
  }, delay)
  return false
}

export { calculatePopoutMenuOffset }
