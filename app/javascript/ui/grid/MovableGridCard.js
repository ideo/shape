import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import FlipMove from 'react-flip-move'
import Rnd from 'react-rnd'
import styled, { keyframes } from 'styled-components'

import { uiStore } from '~/stores'
import v from '~/utils/variables'
import propShapes from '~/utils/propShapes'
import PositionedGridCard from '~/ui/grid/PositionedGridCard'
import GridCard from '~/ui/grid/GridCard'
import GridCardPlaceholder from '~/ui/grid/GridCardPlaceholder'
import GridCardPagination from '~/ui/grid/GridCardPagination'
import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'
import AddSubmission from '~/ui/grid/blankContentTool/AddSubmission'
import GridCardEmptyHotspot from '~/ui/grid/GridCardEmptyHotspot'
import ResizeIcon from '~/ui/icons/ResizeIcon'
import { StyledCardWrapper } from '~/ui/grid/shared'

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

const bounceAnim = zoomLevel => keyframes`
  50% {
    transform: scaleX(${1.125 / zoomLevel}) scaleY(${1.125 / zoomLevel});
  }
`

const InnerCardWrapper = styled.div.attrs({
  style: ({ width, height, transition, transform }) => ({
    transition,
    transform,
    height: `${height}px`,
    width: `${width}px`,
  }),
})`
  transform-origin: left top;
  backface-visibility: hidden;
  font-smoothing: subpixel-antialiased;
  ${props =>
    props.animatedBounce &&
    `
    animation: ${bounceAnim(props.zoomLevel)} 0.25s ease-out;
    `};
`

const cardCSSTransition = 'transform 0.4s, width 0.25s, height 0.25s'
const cardHoverTransition = 'transform 0.2s'

const scrollAmount = () => {
  // When zooming browser in or out, it doesn't work to use `1` as the unit,
  // There aren't any reliable ways to get the zoom level from all browsers.
  // This library doesn't work: https://github.com/tombigel/detect-zoom.
  // window.devicePixelRatio doesn't work on all browsers.
  // Setting a div of a fixed width on the page and measuring it's width doesn't work.
  //
  // What we need is to return a value that is > 1 for zoomed in screens
  // window.devicePixelRatio will be 1 for non-retina
  // and retina is likely at 2, but if zoomed out to 50% is 1
  //
  let amount
  if (window.devicePixelRatio >= 2) {
    amount = window.devicePixelRatio
  } else if (window.devicePixelRatio >= 1) {
    amount = 2
  } else {
    // After testing out multiple values, this seemed to be the right balance
    amount = 1.5 / window.devicePixelRatio
  }
  return amount
}

class MovableGridCard extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      timeoutId: null,
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
    }
  }

  componentWillReceiveProps({ position }) {
    if (this.state.dragging) {
      return
    }
    this.setState({
      x: position.xPos,
      y: position.yPos,
    })
  }

  componentWillUnmount() {
    this.clearDragTimeout()
  }

  handleStart = (e, data) => {
    e.preventDefault()
    this.scrolling = false
    // initialOffset tracks the coordinates *within* the card where you clicked,
    // e.g. bottom left corner of the card itself
    const initialOffsetX = e.screenX - e.target.getBoundingClientRect().x
    const initialOffsetY = e.screenY - e.target.getBoundingClientRect().y

    this.setState({
      initialOffsetX,
      initialOffsetY,
    })
  }

  scrollIfNearPageBounds = e => {
    const { horizontalScroll, card } = this.props
    const { gridW } = uiStore.gridSettings

    // NOTE: these hide so that we can fully control the page scroll
    // otherwise the browser will *also* try to scroll when you hit the edges;
    // however, there is some UI helpfulness lost if you can't see the scrollbars :(
    if (!horizontalScroll) {
      document.body.style['overflow-x'] = 'hidden'
      document.body.style['overflow-y'] = 'hidden'
    }

    // Vertical Scroll
    if (e.clientY < v.topScrollTrigger) {
      // At top of viewport
      this.scrolling = true
      this.scrollUp(null, e.clientY)
      return
    } else if (e.clientY > window.innerHeight - v.topScrollTrigger) {
      // At bottom of viewport
      this.scrolling = true
      this.scrollDown()
      return
    }

    // Horizontal Scroll
    if (!horizontalScroll) {
      this.scrolling = false
      return
    }
    const cardWidth = (card.width * gridW) / 2
    const leftMargin = v.containerPadding.horizontal * 16

    // At right of viewport
    if (e.clientX > window.innerWidth - cardWidth + leftMargin) {
      this.scrolling = true
      this.scrollRight()
      // At left of viewport
    } else if (e.clientX - cardWidth - leftMargin < 0) {
      this.scrolling = true
      this.scrollLeft()
    } else {
      this.scrolling = false
    }
  }

  get scrollElement() {
    const { scrollElement } = this.props
    if (scrollElement) return scrollElement
    return window
  }

  scrollUp = (timestamp, clientY) => {
    if (clientY) this.clientY = clientY
    if (!this.scrolling) return null
    const scrollY = window.scrollY || window.pageYOffset
    if (scrollY < 10) {
      return window.requestAnimationFrame(this.scrollUp)
    }

    this.scrollElement.scrollBy(0, -scrollAmount())

    return window.requestAnimationFrame(this.scrollUp)
  }

  scrollDown = timestamp => {
    if (!this.scrolling) return null
    const scrollY = window.scrollY || window.pageYOffset
    if (
      window.innerHeight + scrollY >=
      document.body.offsetHeight + uiStore.gridSettings.gridH * 2
    ) {
      return window.requestAnimationFrame(this.scrollDown)
    }

    this.scrollElement.scrollBy(0, scrollAmount())

    return window.requestAnimationFrame(this.scrollDown)
  }

  scrollLeft = timestamp => {
    if (!this.scrolling) return null

    this.scrollElement.scrollBy(-scrollAmount(), 0)
    return window.requestAnimationFrame(this.scrollLeft)
  }

  scrollRight = timestamp => {
    if (!this.scrolling) return null

    this.scrollElement.scrollBy(scrollAmount(), 0)
    return window.requestAnimationFrame(this.scrollRight)
  }

  handleDrag = (e, data, dX, dY) => {
    const { position, dragOffset, zoomLevel } = this.props
    // Global dragging should use screen coordinates
    // TODO this could also be a HOC that publishes to the UI store
    const { pageX, pageY } = e
    // When zooming browser in or out, it multiplies pageX and pageY by that zoom
    // e.g. 50% zoom multiplies all coordinate values by 2
    uiStore.drag({ x: pageX, y: pageY })

    // x, y represent the current drag position
    const { x, y } = data

    // don't consider it to be "dragging" unless you've moved >10 px
    if (Math.abs(x - position.xPos) + Math.abs(y - position.yPos) < 10) {
      return
    }

    this.scrollIfNearPageBounds(e)

    const cardX = e.pageX - dragOffset.x
    const cardY = e.pageY - dragOffset.y

    // Set x and y to be in the middle of the card
    // Zoom levels multiply coordinates,
    // so we must also multiply card dimensions by the zoom level
    this.setState({
      x: cardX - position.width / zoomLevel / 2,
      y: cardY - position.height / zoomLevel / 2,
    })

    if (!this.state.dragging) {
      uiStore.closeBlankContentTool()
      // close the MoveMenu to prevent weird behaviors
      uiStore.closeMoveMenu({ deselect: false })
      uiStore.startDragging(this.props.card.id)
      this.setState(
        {
          dragging: true,
          moveComplete: false,
        },
        () => {
          this.props.onDragStart && this.props.onDragStart(this.props.card.id)
        }
      )
    }
    const dragPosition = {
      dragX: cardX,
      dragY: cardY,
      ...position,
    }

    this.dragPosition = dragPosition
    this.props.card.dragPosition = dragPosition
    this.props.onDrag(this.props.card.id, dragPosition)
  }

  handleStop = type => ev => {
    const { horizontalScroll } = this.props
    this.scrolling = false
    document.body.style['overflow-y'] = 'auto'
    if (horizontalScroll) document.body.style['overflow-x'] = 'auto'
    this.setState({ dragging: false, resizing: false }, () => {
      // Resizing has to be reset first, before the handler or the card dimensions
      // will jump back in forth as the grid resizes the actual card while this
      // resize state is still set.
      this.setState({
        resizeWidth: 0,
        resizeHeight: 0,
      })
      this.props.onDragOrResizeStop(this.props.card.id, type, ev)
      const timeoutId = setTimeout(() => {
        // have this item remain "on top" while it animates back
        this.setState({
          moveComplete: true,
        })
        this.scrolling = false
      }, 350)
      uiStore.stopDragging()
      this.setState({
        timeoutId,
      })
      this.scrolling = false
    })
  }

  handleResize = (e, dir, ref, delta, position) => {
    const { isBoardCollection, zoomLevel } = this.props
    if (!this.state.resizing) {
      this.setState({ resizing: true, moveComplete: false })
      uiStore.resetSelectionAndBCT()
      // close the MoveMenu to prevent weird behaviors
      uiStore.closeMoveMenu()
    }
    const gridSettings = isBoardCollection
      ? uiStore.defaultGridSettings
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
    this.scrolling = false
    this.setState({
      resizeWidth: delta.width * zoomLevel,
      resizeHeight: delta.height * zoomLevel,
    })
  }

  // this function gets passed down to the card, so it can place the onClick handler
  handleClick = e => {
    this.scrolling = false
    const { cardType, record } = this.props
    if (uiStore.cardMenuOpenAndPositioned) {
      uiStore.closeCardMenu()
      return
    }
    const formTags = ['SELECT', 'OPTION']
    if (
      typeof e.target.className !== 'string' ||
      // cancel for elements matching or inside a .cancelGridClick
      e.target.className.match(/cancelGridClick/) ||
      e.target.closest('.cancelGridClick') ||
      e.target.className.match(/selectMenu/) ||
      // cancel for links within the card as these should handle their own routing
      (e.target.tagName === 'A' && e.target.href) ||
      formTags.includes(e.target.tagName) ||
      record.type === 'Item::DataItem'
    ) {
      return
    }

    if (record.can_view) {
      // timeout is just a stupid thing so that Draggable doesn't complain about unmounting
      setTimeout(() => {
        this.props.routeTo(cardType, record.id)
      })
    } else {
      uiStore.showPermissionsAlert()
    }
  }

  clearDragTimeout = () => {
    if (this.state.timeoutId) {
      clearTimeout(this.state.timeoutId)
    }
    this.scrolling = false
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

  renderPlaceholder = () => (
    <PositionedGridCard {...this.styleProps()}>
      <GridCardPlaceholder />
    </PositionedGridCard>
  )

  renderEmpty = () => (
    <PositionedGridCard {...this.styleProps()} transition={cardCSSTransition}>
      <GridCardEmptyHotspot
        visible={this.props.card.visible}
        card={this.props.card}
      />
    </PositionedGridCard>
  )

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
    const { card, parent } = this.props
    const styleProps = this.styleProps()
    const { height, width, xPos, yPos } = styleProps
    const { blankType } = card

    let cardElement = <GridCardBlank parent={parent} preselected={blankType} />
    if (cardType === 'submission') {
      cardElement = (
        <AddSubmission
          parent_id={card.parent_id}
          submissionSettings={card.submissionSettings}
          enabled={parent.submissions_enabled}
        />
      )
    }

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

  render() {
    const {
      card,
      cardType,
      record,
      position: { xPos },
      position: { yPos },
      menuOpen,
      canEditCollection,
      isUserCollection,
      isSharedCollection,
      isBoardCollection,
      lastPinnedCard,
      hidden,
      hoveringOverLeft,
      hoveringOverRight,
      holdingOver,
      maxResizeRow,
      maxResizeCol,
      zoomLevel,
      showHotEdge,
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
    } = this.state

    if (cardType === 'placeholder') {
      return this.renderPlaceholder()
    } else if (cardType === 'blank' || cardType === 'submission') {
      return this.renderBlank(cardType)
    } else if (cardType === 'empty') {
      return this.renderEmpty()
    } else if (cardType === 'pagination') {
      return this.renderPagination()
    }

    const gridSettings = isBoardCollection
      ? uiStore.defaultGridSettings
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
      // useful for sub-components to know about the card's height
      height,
      // we want to track "dragging" until the transition is complete
      // also so that click handler doesn't register while dragging
      dragging: !moveComplete,
      handleClick: this.handleClick,
      menuOpen,
      canEditCollection,
      isUserCollection,
      isBoardCollection,
      isSharedCollection,
      lastPinnedCard,
      showHotEdge,
    }

    const draggingMultiple =
      cardProps.dragging && uiStore.multiMoveCardIds.length > 1

    let zIndex = 1
    if (!moveComplete) zIndex = v.zIndex.cardDragging
    if (uiStore.cardMenuOpen.id === card.id) {
      zIndex = v.zIndex.aboveClickWrapper
    }
    let transform = `translateZ(0) scale(${1 / zoomLevel})`
    const adjustedWidth = (width + resizeWidth) / zoomLevel
    const adjustedHeight = (height + resizeHeight) / zoomLevel
    // const outerTransform = `scale(${1 / zoomLevel})`
    let transition = dragging || resizing ? 'none' : cardCSSTransition
    // TODO this should actually check it's a breadcrumb
    const draggedOverBreadcrumb = !!uiStore.activeDragTarget
    if (dragging) {
      transform += ` translate(${xAdjust}px, ${yAdjust}px) rotate(3deg)`
      if (draggedOverBreadcrumb) {
        transform += ' scaleX(0.75) scaleY(0.75) translate(0px, 180px)'
        transition = cardHoverTransition
      }
    } else if (hoveringOverLeft) {
      zIndex = v.zIndex.cardHovering
      const amount = 32 / zoomLevel
      transform += ` translate(${amount}px, -${amount}px)`
      transition = cardHoverTransition
    } else if (hoveringOverRight) {
      zIndex = v.zIndex.cardHovering
      transform += ' scaleX(1.075) scaleY(1.075)'
      transition = cardHoverTransition
    }

    const touchDeviceClass =
      (uiStore.isTouchDevice && cols === 1) || uiStore.isCypress
        ? 'touch-device'
        : ''

    return (
      <StyledCardWrapper
        className={touchDeviceClass}
        dragging={!moveComplete}
        zIndex={zIndex}
        onClick={this.handleWrapperClick}
        innerRef={c => (this.gridCardRef = c)}
        style={{
          display: !dragging && hidden ? 'none' : 'block',
        }}
      >
        <Rnd
          ref={c => {
            this.rnd = c
          }}
          bounds={null}
          onDragStart={this.handleStart}
          onDrag={this.handleDrag}
          onDragStop={this.handleStop('drag')}
          onResizeStart={this.handleStart}
          onResize={this.handleResize}
          onResizeStop={this.handleStop('resize')}
          minWidth={minWidth}
          minHeight={minHeight}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
          dragAxis="none"
          cancel=".no-drag"
          size={{
            width: adjustedWidth,
            height: adjustedHeight,
          }}
          position={{ x, y }}
          default={{
            width: adjustedWidth,
            height: adjustedHeight,
            x: xPos,
            y: yPos,
          }}
          disableDragging={
            !canEditCollection ||
            // NOTE: disabling dragging for touchscreens because of conflict with touch scrolling
            (uiStore.isTouchDevice && cols === 1) ||
            card.isPinnedAndLocked
          }
          enableResizing={{
            bottomRight:
              canEditCollection &&
              !card.isPinnedAndLocked &&
              card.record &&
              !card.record.isChart &&
              !card.record.isGenericFile,
            bottom: false,
            bottomLeft: false,
            left: false,
            right: false,
            top: false,
            topLeft: false,
            topRight: false,
          }}
          extendsProps={{
            handleComponent: {
              bottomRight: () => (
                <StyledResizeIcon menuOpen={menuOpen} className="show-on-hover">
                  <ResizeIcon />
                </StyledResizeIcon>
              ),
            },
          }}
          style={{
            // animate grid items that are moving as they're being displaced
            transition,
          }}
        >
          <InnerCardWrapper
            animatedBounce={holdingOver}
            width={width + resizeWidth}
            height={height + resizeHeight}
            transition={transition}
            transform={transform}
            zoomLevel={zoomLevel}
          >
            <GridCard
              {...cardProps}
              draggingMultiple={draggingMultiple}
              hoveringOver={hoveringOverRight}
              zoomLevel={zoomLevel}
            />
          </InnerCardWrapper>
        </Rnd>
      </StyledCardWrapper>
    )
  }
}

MovableGridCard.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  cardType: PropTypes.string.isRequired,
  canEditCollection: PropTypes.bool.isRequired,
  isUserCollection: PropTypes.bool.isRequired,
  isSharedCollection: PropTypes.bool.isRequired,
  isBoardCollection: PropTypes.bool.isRequired,
  hoveringOverLeft: PropTypes.bool,
  hoveringOverRight: PropTypes.bool,
  holdingOver: PropTypes.bool,
  position: PropTypes.shape(propShapes.position).isRequired,
  dragOffset: PropTypes.shape(propShapes.xy).isRequired,
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  onDrag: PropTypes.func.isRequired,
  onResize: PropTypes.func.isRequired,
  onDragOrResizeStop: PropTypes.func.isRequired,
  routeTo: PropTypes.func.isRequired,
  menuOpen: PropTypes.bool.isRequired,
  lastPinnedCard: PropTypes.bool,
  hidden: PropTypes.bool,
  zoomLevel: PropTypes.number,
  maxResizeRow: PropTypes.number,
  maxResizeCol: PropTypes.number,
  scrollElement: MobxPropTypes.objectOrObservableObject,
  horizontalScroll: PropTypes.bool,
  showHotEdge: PropTypes.bool,
}

MovableGridCard.defaultProps = {
  lastPinnedCard: false,
  hidden: false,
  zoomLevel: 1,
  maxResizeRow: 2,
  maxResizeCol: 4,
  scrollElement: null,
  horizontalScroll: false,
  showHotEdge: true,
  hoveringOverLeft: false,
  hoveringOverRight: false,
  holdingOver: false,
}

export default MovableGridCard
