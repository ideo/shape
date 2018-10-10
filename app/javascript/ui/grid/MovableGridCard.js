import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import FlipMove from 'react-flip-move'
import Rnd from 'react-rnd'
import styled from 'styled-components'

import { uiStore } from '~/stores'
import v from '~/utils/variables'
import propShapes from '~/utils/propShapes'
import PositionedGridCard from '~/ui/grid/PositionedGridCard'
import GridCard from '~/ui/grid/GridCard'
import GridCardPlaceholder from '~/ui/grid/GridCardPlaceholder'
import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'
import AddSubmission from '~/ui/grid/blankContentTool/AddSubmission'
import GridCardEmpty from '~/ui/grid/GridCardEmpty'
import ResizeIcon from '~/ui/icons/ResizeIcon'

const StyledResizeIcon = styled.div`
  position: absolute;
  /* hide the resize icon while the menu is open so they don't overlap */
  display: ${props => (props.menuOpen ? 'none' : 'block')};
  z-index: ${v.zIndex.gridCardBg};
  right: 0.75rem;
  bottom: 0.75rem;
  color: ${v.colors.gray};
  width: 1.25rem;
  height: 1.25rem;
  svg {
    width: 60%;
    height: 60%;
  }
`

const StyledCardWrapper = styled.div`
  z-index: ${props => props.zIndex};
  /* this is for both the ResizeIcon (in this component) and CardMenu (in GridCard) */
  .show-on-hover {
    opacity: 0;
    transition: opacity 0.25s;
  }
  &:hover {
    z-index: ${props => props.zIndex};
  }
  &:hover,
  &.touch-device {
    .show-on-hover {
      /* don't show hover items while dragging */
      opacity: ${props => (props.dragging ? 0 : 1)};
    }
  }
`

const cardCSSTransition = 'transform 0.4s, width 0.25s, height 0.25s'
const TOP_SCROLL_TRIGGER = 210

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
    this.scrolling = false
    // initialOffset tracks the coordinates *within* the card where you clicked,
    // e.g. bottom left corner of the card itself
    const initialOffsetX = e.screenX - e.target.getBoundingClientRect().x
    const initialOffsetY = e.screenY - e.target.getBoundingClientRect().y

    document.body.style['overflow-y'] = 'hidden'
    this.setState({
      initialOffsetX,
      initialOffsetY,
    })
  }

  scrollUp = (timestamp, clientY) => {
    if (clientY) this.clientY = clientY
    if (!this.scrolling) return null
    if (window.scrollY < 10) {
      return window.requestAnimationFrame(this.scrollUp)
    }
    const scrollAmount = 1

    window.scrollBy(0, -scrollAmount)

    return window.requestAnimationFrame(this.scrollUp)
  }

  scrollDown = timestamp => {
    if (!this.scrolling) return null
    if (
      window.innerHeight + window.scrollY >=
      document.body.offsetHeight + uiStore.gridSettings.gridH
    ) {
      return window.requestAnimationFrame(this.scrollDown)
    }
    const scrollAmount = 1

    window.scrollBy(0, scrollAmount)

    return window.requestAnimationFrame(this.scrollDown)
  }

  handleDrag = (e, data, dX, dY) => {
    const { position } = this.props
    // x, y represent the current drag position
    const { x, y } = data

    // don't consider it to be "dragging" unless you've moved >10 px
    if (Math.abs(x - position.xPos) + Math.abs(y - position.yPos) < 10) {
      return
    }

    if (e.clientY < TOP_SCROLL_TRIGGER) {
      // At top of viewport
      this.scrolling = true
      this.scrollUp(null, e.clientY)
    } else if (e.clientY > window.innerHeight - TOP_SCROLL_TRIGGER) {
      // At bottom of viewport
      this.scrolling = true
      this.scrollDown()
    } else {
      this.scrolling = false
    }

    const pageMargin = window.innerWidth - v.maxWidth
    const cardX = e.pageX - pageMargin / 2
    const cardY = e.pageY - TOP_SCROLL_TRIGGER
    this.setState({
      x: cardX - position.width / 2,
      y: cardY - position.height / 2,
    })

    if (!this.state.dragging) {
      uiStore.resetSelectionAndBCT()
      // close the MoveMenu to prevent weird behaviors
      uiStore.closeMoveMenu()
      uiStore.startDragging()
      this.setState({
        dragging: true,
        moveComplete: false,
      })
    }
    const dragPosition = {
      dragX: cardX,
      dragY: cardY,
      ...position,
    }

    this.dragPosition = dragPosition
    this.props.onDrag(this.props.card.id, dragPosition)
  }

  handleStop = ev => {
    this.scrolling = false
    document.body.style['overflow-y'] = 'auto'
    this.setState({ dragging: false, resizing: false }, () => {
      this.props.onDragOrResizeStop(this.props.card.id)
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
    if (!this.state.resizing) {
      this.setState({ resizing: true, moveComplete: false })
      uiStore.resetSelectionAndBCT()
      // close the MoveMenu to prevent weird behaviors
      uiStore.closeMoveMenu()
    }
    const { gridW, gridH, cols } = uiStore.gridSettings
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
  }

  // this function gets passed down to the card, so it can place the onClick handler
  handleClick = e => {
    this.scrolling = false
    const { card, cardType, record } = this.props
    // TODO: make sure this is cross-browser compatible?
    if (e.metaKey || e.shiftKey) {
      if (e.metaKey) {
        // individually select
        uiStore.toggleSelectedCardId(card.id)
      }
      if (e.shiftKey) {
        // select everything between
        uiStore.selectCardsUpTo(card.id)
      }
      return
    }
    if (e.target.className.match(/cancelGridClick/)) return
    if (e.target.tagName === 'A' && e.target.href) return

    // timeout is just a stupid thing so that Draggable doesn't complain about unmounting
    setTimeout(() => {
      this.props.routeTo(cardType, record.id)
    })
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

  renderEmpty = ({ beginningOfRow } = {}) => (
    <PositionedGridCard {...this.styleProps()} transition={cardCSSTransition}>
      <GridCardEmpty
        card={this.props.card}
        dragging={this.state.dragging}
        showHotspot={beginningOfRow}
      />
    </PositionedGridCard>
  )

  renderBlank = cardType => {
    const { card, parent } = this.props
    const styleProps = this.styleProps()
    const { height, xPos, yPos } = styleProps
    const { blankType } = card

    let cardElement = (
      <GridCardBlank height={height} parent={parent} preselected={blankType} />
    )
    if (cardType === 'submission') {
      cardElement = (
        <AddSubmission
          parent_id={card.parent_id}
          submissionSettings={card.submissionSettings}
        />
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
            transformOrigin: `${xPos}px ${yPos}px`,
          },
          to: {
            transform: `scaleX(1) scaleY(1)`,
            transformOrigin: `${xPos}px ${yPos}px`,
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
      lastPinnedCard,
    } = this.props

    let {
      position: { height },
      position: { width },
    } = this.props

    const { dragging, resizing, moveComplete, x, y } = this.state

    if (cardType === 'placeholder') {
      return this.renderPlaceholder()
    } else if (cardType === 'blank' || cardType === 'submission') {
      return this.renderBlank(cardType)
    } else if (cardType === 'empty') {
      return this.renderEmpty({ beginningOfRow: card.position.x === 0 })
    }

    const { gridW, gridH, cols } = uiStore.gridSettings
    const minWidth = gridW * 0.8
    const minHeight = gridH * 0.8
    // need to always set Rnd maxWidth to 4 columns instead of `cols`
    // because of this issue: https://github.com/bokuweb/react-rnd/issues/221
    const maxWidth = uiStore.gridWidthFor(4)
    const maxHeight = uiStore.gridHeightFor(2, { useDefault: true })

    let xAdjust = 0
    let yAdjust = 0

    if (dragging) {
      // experiment -- shrink wide and tall cards for easier movement
      if (width > 500) {
        if (this.state.initialOffsetX > TOP_SCROLL_TRIGGER) {
          xAdjust = this.state.initialOffsetX * 0.25
        }
        width *= 0.8
      }
      if (height > 500) {
        if (this.state.initialOffsetY > TOP_SCROLL_TRIGGER) {
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
      isSharedCollection,
      lastPinnedCard,
    }

    let zIndex = 0
    if (!moveComplete) zIndex = v.zIndex.cardDragging
    if (
      uiStore.cardMenuOpenAndPositioned &&
      uiStore.cardMenuOpen.id === card.id
    ) {
      zIndex = v.zIndex.aboveClickWrapper
    }
    if (card.id === 42773) console.log('z', zIndex)
    return (
      <StyledCardWrapper
        className={uiStore.isTouchDevice ? 'touch-device' : ''}
        dragging={!moveComplete}
        zIndex={zIndex}
      >
        <Rnd
          ref={c => {
            this.rnd = c
          }}
          bounds={null}
          onDragStart={this.handleStart}
          onDrag={this.handleDrag}
          onDragStop={this.handleStop}
          onResizeStart={this.handleStart}
          onResize={this.handleResize}
          onResizeStop={this.handleStop}
          minWidth={minWidth}
          minHeight={minHeight}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
          dragAxis="none"
          cancel=".no-drag"
          size={{ width, height }}
          position={{ x, y }}
          default={{ width, height, x: xPos, y: yPos }}
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
          // resizeGrid={resizeGrid}
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
            transition: dragging || resizing ? 'none' : cardCSSTransition,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: dragging
                ? `translate(${xAdjust}px, ${yAdjust}px) rotate(3deg)`
                : '',
            }}
          >
            <GridCard {...cardProps} />
          </div>
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
  position: PropTypes.shape(propShapes.position).isRequired,
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  onDrag: PropTypes.func.isRequired,
  onResize: PropTypes.func.isRequired,
  onDragOrResizeStop: PropTypes.func.isRequired,
  routeTo: PropTypes.func.isRequired,
  menuOpen: PropTypes.bool.isRequired,
  lastPinnedCard: PropTypes.bool,
}

MovableGridCard.defaultProps = {
  lastPinnedCard: false,
}

export default MovableGridCard
