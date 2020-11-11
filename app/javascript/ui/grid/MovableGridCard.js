import _ from 'lodash'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import FlipMove from 'react-flip-move'
import Rnd from 'react-rnd'
import styled, { css, keyframes } from 'styled-components'

import { uiStore } from '~/stores'
import v, { FOAMCORE_GRID_BOUNDARY } from '~/utils/variables'
import propShapes from '~/utils/propShapes'
import PositionedGridCard from '~/ui/grid/PositionedGridCard'
import GridCard from '~/ui/grid/GridCard'
import GridCardPagination from '~/ui/grid/GridCardPagination'
import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'
import AddSubmission from '~/ui/grid/blankContentTool/AddSubmission'
import GridCardEmptyHotspot from '~/ui/grid/interactionLayer/GridCardEmptyHotspot'
import ResizeIcon from '~/ui/icons/ResizeIcon'
import { StyledCardWrapper } from '~/ui/grid/shared'
import { pageBoundsScroller } from '~/utils/ScrollNearPageBoundsService'

const GridCardPreload = styled.div`
  height: 100%;
  width: 100%;
  background: ${v.colors.commonMediumTint};
`

const StyledResizeIcon = styled.div`
  position: absolute;
  /* hide the resize icon while the menu is open so they don't overlap */
  display: ${props => (props.menuOpen ? 'none' : 'block')};
  z-index: ${v.zIndex.gridCardBg};
  right: 0.75rem;
  bottom: 0.75rem;
  color: ${v.colors.commonMedium};
  width: 1.25rem;
  height: 1.25rem;
  svg {
    width: 60%;
    height: 60%;
  }
`

const bounce = zoomLevel => keyframes`
  50% {
    transform: scaleX(${1.125 / zoomLevel}) scaleY(${1.125 / zoomLevel});
  }
`
const bounceAnim = props => css`
  ${bounce(props.zoomLevel)} 0.25s ease-out;
`

const InnerCardWrapper = styled.div.attrs(
  ({ width, height, transition, transform, zoomLevel, animatedBounce }) => ({
    style: {
      transition,
      transform,
      height: `${height}px`,
      width: `${width}px`,
    },
    animation: animatedBounce ? bounceAnim : 'none',
  })
)`
  animation: ${props => props.animation};
  transform-origin: left top;
  backface-visibility: hidden;
  font-smoothing: subpixel-antialiased;
  @media print {
    page-break-inside: avoid;
    page-break-after: always;
  }
`

const cardCSSTransition = 'transform 0.4s, width 0.25s, height 0.25s'
const cardHoverTransition = 'transform 0.2s'

@observer
class MovableGridCard extends React.Component {
  unmounted = false
  timeoutId = null

  constructor(props) {
    super(props)
    this.state = {
      // this is really just used so that it will reset when you finish dragging
      dragging: false,
      resizing: false,
      moveComplete: true,
      // track where on the page the mouse position is, e.g. if browser is stretched wide
      initialOffsetX: 0,
      initialOffsetY: 0,
      x: props.position.xPos,
      y: props.position.yPos,
      resizeWidth: 0,
      resizeHeight: 0,
      allowTouchDeviceDragging: false,
      // if the card was marked to preload in Collection#API_fetchCards
      preloading: !!props.card.preload,
    }
    this.debouncedAllowTouchDeviceDrag = _.debounce(() => {
      if (this.unmounted) return
      this.setState({ allowTouchDeviceDragging: true })
    }, v.touchDeviceHoldToDragTime)
  }

  componentDidMount() {
    const { record } = this.props.card
    if (!this.state.preloading) {
      return
    }
    if (this.state.preloading && _.isEmpty(record)) {
      // when we've just loaded the initial layout (no card.record), preserve the preloading state
      return
    }
    this.finishPreloading()
  }

  componentDidUpdate(prevProps) {
    const { record } = this.props.card
    if (this.state.preloading && !_.isEmpty(record)) {
      this.finishPreloading()
    }
    if (this.state.dragging || this.unmounted) {
      return
    }
    const { xPos, yPos } = this.props.position
    if (xPos === this.state.x && yPos === this.state.y) {
      return
    }
    this.setState({
      x: xPos,
      y: yPos,
    })
  }

  componentWillUnmount() {
    this.unmounted = true
    this.clearDragTimeout()
  }

  finishPreloading() {
    setTimeout(() => {
      if (this.unmounted) return
      // after a slight delay, turn preloading off and render the actual GridCard
      this.setState({ preloading: false })
    }, 150)
  }

  get shouldDragCard() {
    return (
      !uiStore.isTouchDevice ||
      (uiStore.isTouchDevice && this.state.allowTouchDeviceDragging)
    )
  }

  get collaborator() {
    const { record, card } = this.props
    if (card && card.isBctPlaceholder) {
      const { placeholder_editor_id } = card
      const { parent } = this.props

      if (!parent || !placeholder_editor_id) return null

      const collaboratorForPlaceholder = _.find(
        parent.collaborators,
        c => c.id && parseInt(c.id) === placeholder_editor_id
      )

      if (!collaboratorForPlaceholder) return null

      const { color, name } = collaboratorForPlaceholder
      return {
        color,
        name,
      }
    } else if (!_.isEmpty(record)) {
      const lastCollaboratorForRecord = _.last(record.collaborators)
      if (!lastCollaboratorForRecord) return null

      const { color } = lastCollaboratorForRecord
      return {
        color,
      }
    }

    return null
  }

  handleStart = (e, data) => {
    e.preventDefault()
    pageBoundsScroller.setScrolling(false)
    // initialOffset tracks the coordinates *within* the card where you clicked,
    // e.g. bottom left corner of the card itself
    const initialOffsetX = e.screenX - e.target.getBoundingClientRect().x
    const initialOffsetY = e.screenY - e.target.getBoundingClientRect().y
    this.debouncedAllowTouchDeviceDrag()
    this.setState({
      initialOffsetX,
      initialOffsetY,
    })
  }

  handleDrag = (e, data) => {
    if (!this.shouldDragCard || this.unmounted) return
    const {
      card,
      position,
      dragOffset,
      horizontalScroll,
      zoomLevel,
    } = this.props
    // Global dragging should use screen coordinates
    // TODO this could also be a HOC that publishes to the UI store
    let { pageX, pageY } = e
    if (typeof pageX === 'undefined' && e.targetTouches) {
      pageX = e.targetTouches[0].pageX
      pageY = e.targetTouches[0].pageY
    }
    // When zooming browser in or out, it multiplies pageX and pageY by that zoom
    // e.g. 50% zoom multiplies all coordinate values by 2
    uiStore.drag({ x: pageX, y: pageY })
    this.debouncedAllowTouchDeviceDrag.cancel()

    // x, y represent the current drag position
    const { x, y } = data

    // don't consider it to be "dragging" unless you've moved >10 px
    if (Math.abs(x - position.xPos) + Math.abs(y - position.yPos) < 10) {
      return
    }

    pageBoundsScroller.scrollIfNearPageBounds(e, {
      horizontalScroll,
    })

    const cardX = pageX - dragOffset.x
    const cardY = pageY - dragOffset.y

    // Set x and y to be in the middle of the card
    // Zoom levels multiply coordinates,
    // so we must also multiply card dimensions by the zoom level
    this.setState({
      x: cardX - position.width / zoomLevel / 2,
      y: cardY - position.height / zoomLevel / 2,
    })

    if (!this.state.dragging) {
      uiStore.closeBlankContentTool()
      uiStore.reselectOnlyMovableCards()
      uiStore.startDragging(card.id)
      this.setState(
        {
          dragging: true,
          moveComplete: false,
        },
        () => {
          this.props.onDragStart && this.props.onDragStart(card.id)
        }
      )
    }
    const dragPosition = {
      dragX: cardX,
      dragY: cardY,
      ...position,
    }

    this.dragPosition = dragPosition
    card.dragPosition = dragPosition
    this.props.onDrag(card.id, dragPosition)
  }

  handleStop = type => ev => {
    if (this.unmounted) return
    const { horizontalScroll, onDragOrResizeStop } = this.props
    pageBoundsScroller.setScrolling(false)
    document.body.style['overflow-y'] = 'auto'
    if (horizontalScroll) document.body.style['overflow-x'] = 'auto'
    this.setState(
      { dragging: false, resizing: false, allowTouchDeviceDragging: false },
      () => {
        // Resizing has to be reset first, before the handler or the card dimensions
        // will jump back in forth as the grid resizes the actual card while this
        // resize state is still set.
        this.setState({
          resizeWidth: 0,
          resizeHeight: 0,
        })
        onDragOrResizeStop(this.props.card.id, type, ev)
        this.timeoutId = setTimeout(() => {
          if (this.umounted) return
          // have this item remain "on top" while it animates back
          this.setState({
            moveComplete: true,
          })
          pageBoundsScroller.setScrolling(false)
        }, 350)
        uiStore.stopDragging()
        this.debouncedAllowTouchDeviceDrag.cancel()
        pageBoundsScroller.setScrolling(false)
      }
    )
  }

  handleResize = (e, dir, ref, delta, position) => {
    const { isBoardCollection, zoomLevel } = this.props
    if (!this.state.resizing) {
      this.setState({ resizing: true, moveComplete: false })
      uiStore.resetSelectionAndBCT()
      uiStore.setEditingCardCover(null)
    }
    const gridSettings = isBoardCollection
      ? v.defaultGridSettings
      : uiStore.gridSettings
    const { cols } = gridSettings
    const gridW = gridSettings.gridW / zoomLevel
    const gridH = gridSettings.gridH / zoomLevel
    const { card } = this.props
    const pad = 0.75
    const newSize = {
      // pad by some so that as you resize it doesn't immediately jump sizes
      width: card.width + Math.floor(delta.width / gridW + pad),
      height: card.height + Math.floor(delta.height / gridH + pad),
    }
    // e.g. if card.width is 4, but we're at 2 columns, max out at cardWidth = 2
    newSize.width = Math.max(Math.min(newSize.width, cols), 1)
    // always max out height at 2
    newSize.height = Math.max(Math.min(newSize.height, 2), 1)
    this.props.onResize(this.props.card.id, newSize)
    pageBoundsScroller.setScrolling(false)
    this.setState({
      resizeWidth: delta.width * zoomLevel,
      resizeHeight: delta.height * zoomLevel,
    })
  }

  clearDragTimeout = () => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
    pageBoundsScroller.setScrolling(false)
  }

  styleProps = () => {
    const {
      position: { xPos },
      position: { yPos },
      position: { height },
      position: { width },
    } = this.props

    return {
      width,
      height,
      xPos,
      yPos,
    }
  }

  renderEmpty = () => {
    const { currentlyZooming } = uiStore
    const transition = currentlyZooming ? 'none' : cardCSSTransition
    return (
      <PositionedGridCard {...this.styleProps()} transition={transition}>
        <GridCardEmptyHotspot
          // this was set to always visible...
          visible={this.props.card.visible}
          card={this.props.card}
        />
      </PositionedGridCard>
    )
  }

  renderPagination = () => {
    const { loadCollectionCards } = this.props
    const collection = this.props.parent
    return (
      <PositionedGridCard {...this.styleProps()}>
        <GridCardPagination
          collection={collection}
          loadCollectionCards={loadCollectionCards}
          nextPage={collection.nextPage}
        />
      </PositionedGridCard>
    )
  }

  renderBlank = cardType => {
    const { card, parent, zoomLevel } = this.props
    const styleProps = this.styleProps()
    const { height, width, xPos, yPos } = styleProps
    const { blankType } = card
    let cardElement = <GridCardBlank parent={parent} preselected={blankType} />
    let transformOrigin = `${xPos}px ${yPos}px`
    if (card.id === 'blank') {
      transformOrigin = `${xPos + width / 2}px ${yPos + height / 2}px`
    }

    let offsetXAmt = 0

    if (xPos < window.pageXOffset) {
      offsetXAmt = window.pageXOffset - xPos
      styleProps.xPos = xPos + offsetXAmt
    }

    const padding = 40
    if (xPos + width + padding > window.pageXOffset + window.innerWidth) {
      offsetXAmt = xPos - (window.pageXOffset + window.innerWidth)
      styleProps.xPos = xPos - width - offsetXAmt - padding
    }

    if (cardType === 'submission') {
      cardElement = (
        <AddSubmission
          parent_id={card.parent_id}
          submissionSettings={card.submissionSettings}
          enabled={parent.submissions_enabled}
        />
      )
      return (
        <div
          style={{
            transform: `translateZ(0) scale(${1 / zoomLevel})`,
            transformOrigin,
          }}
        >
          <PositionedGridCard {...styleProps}>{cardElement}</PositionedGridCard>
        </div>
      )
    }

    return (
      <FlipMove
        // z-index is important because BCT has a popoutMenu
        style={{ zIndex: v.zIndex.gridCard }}
        easing="ease-out"
        appearAnimation={{
          from: {
            transform: `scaleX(0) scaleY(0)`,
            transformOrigin,
          },
          to: {
            transform: `scaleX(1) scaleY(1)`,
            transformOrigin,
          },
        }}
      >
        <div>
          <PositionedGridCard {...styleProps}>{cardElement}</PositionedGridCard>
        </div>
      </FlipMove>
    )
  }

  renderResizeIcon = menuOpen => {
    return (
      <StyledResizeIcon menuOpen={menuOpen} className="show-on-hover">
        <ResizeIcon />
      </StyledResizeIcon>
    )
  }

  get hoveringOver() {
    const { card, cardType, parent } = this.props
    const { hoveringOver } = uiStore
    const isHoveringOver =
      hoveringOver && hoveringOver.card && hoveringOver.card.id === card.id

    let holdingOver = false
    let hoveringOverLeft = false
    let hoveringOverRight = false
    if (isHoveringOver) {
      holdingOver = hoveringOver.holdingOver
      hoveringOverLeft = hoveringOver.direction === 'left'
      hoveringOverRight =
        hoveringOver.direction === 'right' ||
        // in foamcore, hovering over a collection is always treated as hoveringOverRight
        (cardType === 'collections' && parent.isBoard)
    }

    return {
      holdingOver,
      hoveringOverLeft,
      hoveringOverRight,
    }
  }

  render() {
    const {
      card,
      cardType,
      record,
      position: { xPos },
      position: { yPos },
      canEditCollection,
      isUserCollection,
      isSharedCollection,
      isBoardCollection,
      lastPinnedCard,
      maxResizeRow,
      maxResizeCol,
      zoomLevel,
      showHotEdge,
      searchResult,
    } = this.props

    let {
      position: { height },
      position: { width },
    } = this.props

    const {
      dragging,
      resizing,
      moveComplete,
      resizeWidth,
      resizeHeight,
      x,
      y,
      preloading,
    } = this.state

    const {
      holdingOver,
      hoveringOverLeft,
      hoveringOverRight,
    } = this.hoveringOver

    const { zIndex, cardTiltDegrees } = v
    const { cardDragging, aboveClickWrapper, cardHovering } = zIndex

    if (cardType === 'blank' || cardType === 'submission') {
      return this.renderBlank(cardType)
    } else if (cardType === 'empty') {
      return this.renderEmpty()
    } else if (cardType === 'pagination') {
      return this.renderPagination()
    }

    const gridSettings = isBoardCollection
      ? v.defaultGridSettings
      : uiStore.gridSettings
    const { gridW, gridH, cols, gutter } = gridSettings
    // TODO: esp. for foamcore, change this min/max pixel based resize logic...
    // resize placeholder should determine if it's overlapping an empty spot or not
    const minWidth = (gridW * 0.8) / zoomLevel
    const minHeight = (gridH * 0.8) / zoomLevel
    // need to always set Rnd maxWidth to full amount (e.g. don't divide by zoomLevel)
    // because of this issue: https://github.com/bokuweb/react-rnd/issues/221
    const maxWidth = maxResizeCol * (gridW + gutter)
    const maxHeight = uiStore.gridHeightFor(maxResizeRow, {
      useDefault: true,
    })

    let xAdjust = 0
    let yAdjust = 0

    if (dragging) {
      // experiment -- shrink wide and tall cards for easier movement
      if (width > 500) {
        if (this.state.initialOffsetX > v.topScrollTrigger) {
          xAdjust = this.state.initialOffsetX * 0.25
        }
        width *= 0.8
      }
      if (height > 500) {
        if (this.state.initialOffsetY > v.topScrollTrigger) {
          yAdjust = this.state.initialOffsetY * 0.25
        }
        height *= 0.8
      }
    }

    const cardProps = {
      card,
      cardType,
      record,
      collaborator: this.collaborator,
      // useful for sub-components to know about the card's height
      height,
      // we want to track "dragging" until the transition is complete
      // also so that click handler doesn't register while dragging
      dragging: !moveComplete,
      canEditCollection,
      isUserCollection,
      isBoardCollection,
      isSharedCollection,
      lastPinnedCard,
      showHotEdge,
      searchResult,
    }

    const {
      cardMenuOpen,
      editingCardCover,
      activeDragTarget,
      currentlyZooming,
      shouldOpenMoveSnackbar,
      textEditingCardId,
      isTouchDevice,
      isCypress,
    } = uiStore

    let _zIndex = 1
    let menuOpen = false
    if (!moveComplete) _zIndex = cardDragging
    let disableDragging =
      !canEditCollection ||
      card.isPinnedAndLocked ||
      textEditingCardId === card.id
    const { currentUser } = uiStore.apiStore
    const isSuperAdmin = currentUser && currentUser.is_super_admin
    if (isSuperAdmin) {
      // allow super admin to move things around as needed
      disableDragging = false
    }
    if (_.includes([cardMenuOpen.id, editingCardCover], card.id)) {
      menuOpen = true
      disableDragging = true
      // TODO: decouple context menus from GridCard so they can have their own z-index?
      _zIndex = aboveClickWrapper
    }
    let transform = `translateZ(0) scale(${1 / zoomLevel})`
    const adjustedWidth = (width + resizeWidth) / zoomLevel
    const adjustedHeight = (height + resizeHeight) / zoomLevel
    let transition =
      dragging || resizing || currentlyZooming || preloading
        ? 'none'
        : cardCSSTransition
    // TODO this should actually check it's a breadcrumb
    const draggedOverBreadcrumb = !!activeDragTarget
    if (dragging && this.state.allowTouchDeviceDragging) {
      transform += ` translate(${xAdjust}px, ${yAdjust}px) rotate(${cardTiltDegrees}deg)`
      if (draggedOverBreadcrumb) {
        transform += ' scaleX(0.75) scaleY(0.75) translate(0px, 180px)'
        transition = cardHoverTransition
      }
    } else if (uiStore.textEditingItem === record) {
      _zIndex = cardDragging
    } else if (hoveringOverLeft) {
      _zIndex = cardHovering
      const amount = 32 / zoomLevel
      transform += ` translate(${amount}px, -${amount}px)`
      transition = cardHoverTransition
    } else if (hoveringOverRight) {
      _zIndex = cardHovering
      transform += ' scaleX(1.075) scaleY(1.075)'
      transition = cardHoverTransition
    }

    const isTouchDeviceSingleColumn = isTouchDevice && cols === 1
    const touchDeviceClass =
      isTouchDeviceSingleColumn || isCypress ? 'touch-device' : ''

    const defaultPosition = {
      width: adjustedWidth,
      height: adjustedHeight,
      x: xPos,
      y: yPos,
    }

    let shouldHide = false
    if (card.isMDLPlaceholder) {
      _zIndex = cardDragging
      cardProps.searchResult = true
      cardProps.canEditCollection = false
      shouldHide = !shouldOpenMoveSnackbar
    }

    const draggingMultiple =
      cardProps.dragging && uiStore.multiMoveCardIds.length > 1

    const mdlPlaceholder = !dragging && card.isMDLPlaceholder

    const dragPosition = mdlPlaceholder ? null : { x, y }

    const enableResizing =
      canEditCollection &&
      uiStore.selectedArea.minX === null &&
      (isSuperAdmin || !card.isPinnedAndLocked) &&
      card.persisted &&
      card.record &&
      !card.record.isChart &&
      !card.record.isGenericFile &&
      !card.record.isCarousel

    const rndProps = {
      ref: c => {
        this.rnd = c
      },
      bounds: isBoardCollection ? `.${FOAMCORE_GRID_BOUNDARY}` : null,
      onDragStart: this.handleStart,
      onDrag: this.handleDrag,
      onDragStop: this.handleStop('drag'),
      onResizeStart: this.handleStart,
      onResize: this.handleResize,
      onResizeStop: this.handleStop('resize'),
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
      dragAxis: 'none',
      cancel: '.no-drag',
      size: {
        width: adjustedWidth,
        height: adjustedHeight,
      },
      // the position that updates as you drag the card
      position: dragPosition,
      // "home base" for this card; where it actually sits in the grid
      default: defaultPosition,
      disableDragging,
      enableResizing: {
        bottomRight: enableResizing,
        bottom: false,
        bottomLeft: false,
        left: false,
        right: false,
        top: false,
        topLeft: false,
        topRight: false,
      },
      extendsProps: {
        handleComponent: {
          bottomRight: () => this.renderResizeIcon(menuOpen),
        },
      },
      style: {
        // animate grid items that are moving as they're being displaced
        transition,
      },
      resizeHandleStyles: {
        bottomRight: {
          zIndex: `${
            uiStore.cardMenuOpen && uiStore.cardMenuOpen.id
              ? -1 // place behind action menu when open
              : v.zIndex.gridCard
          }`,
        },
      },
    }

    return (
      <StyledCardWrapper
        className={touchDeviceClass}
        dragging={!moveComplete}
        zIndex={_zIndex}
        onClick={this.handleWrapperClick}
        ref={c => (this.gridCardRef = c)}
        moving={mdlPlaceholder}
        hidden={shouldHide}
        allowTouchAction
        // for mdlPlaceholder
        maxWidth={card.maxWidth}
        maxHeight={card.maxHeight}
        width={card.maxWidth * v.defaultGridSettings.gridW}
        height={card.maxHeight * v.defaultGridSettings.gridH}
        selectedMultiple={uiStore.movingCardIds.length > 1}
        // <-----
      >
        <Rnd {...rndProps}>
          <InnerCardWrapper
            animatedBounce={holdingOver}
            width={(width || 1) + resizeWidth}
            height={(height || 1) + resizeHeight}
            transition={transition}
            transform={transform}
            zoomLevel={zoomLevel}
          >
            {/* During preload we just render a gray square to simplify initial render */}
            {preloading && <GridCardPreload />}
            {!preloading && (
              <GridCard
                {...cardProps}
                draggingMultiple={draggingMultiple}
                hoveringOver={hoveringOverRight}
                zoomLevel={zoomLevel}
              />
            )}
          </InnerCardWrapper>
        </Rnd>
      </StyledCardWrapper>
    )
  }
}

MovableGridCard.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  cardType: PropTypes.string,
  position: PropTypes.shape(propShapes.position).isRequired,
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  onDrag: PropTypes.func.isRequired,
  onResize: PropTypes.func.isRequired,
  onDragOrResizeStop: PropTypes.func.isRequired,
  dragOffset: PropTypes.shape(propShapes.xy),
  canEditCollection: PropTypes.bool,
  isUserCollection: PropTypes.bool,
  isSharedCollection: PropTypes.bool,
  isBoardCollection: PropTypes.bool,
  lastPinnedCard: PropTypes.bool,
  zoomLevel: PropTypes.number,
  maxResizeRow: PropTypes.number,
  maxResizeCol: PropTypes.number,
  horizontalScroll: PropTypes.bool,
  showHotEdge: PropTypes.bool,
  searchResult: PropTypes.bool,
}

MovableGridCard.defaultProps = {
  cardType: '',
  canEditCollection: false,
  isUserCollection: false,
  isSharedCollection: false,
  isBoardCollection: false,
  lastPinnedCard: false,
  zoomLevel: 1,
  maxResizeRow: 2,
  maxResizeCol: 4,
  horizontalScroll: false,
  showHotEdge: true,
  dragOffset: {
    x: 0,
    y: 0,
  },
  searchResult: false,
}

export default MovableGridCard
