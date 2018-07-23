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
  /* this is for both the ResizeIcon (in this component) and CardMenu (in GridCard) */
  .show-on-hover {
    opacity: 0;
    transition: opacity 0.25s;
  }
  &:hover {
    z-index: ${v.zIndex.gridCard};
    .show-on-hover {
      /* don't show hover items while dragging */
      opacity: ${props => (props.dragging ? 0 : 1)};
    }
  }
  z-index: ${props => (props.dragging ? v.zIndex.cardDragging + 1 : 0)};
`

const cardCSSTransition = 'transform 0.4s, width 0.25s, height 0.25s'

class MovableGridCard extends React.PureComponent {
  state = {
    timeoutId: null,
    // this is really just used so that it will reset when you finish dragging
    dragging: false,
    resizing: false,
    moveComplete: true,
    // track where on the page the mouse position is, e.g. if browser is stretched wide
    initialOffsetX: 0,
    initialOffsetY: 0,
  }

  componentWillUnmount() {
    this.clearDragTimeout()
  }

  handleStart = (e, data) => {
    // initialOffset tracks the coordinates *within* the card where you clicked,
    // e.g. bottom left corner of the card itself
    const initialOffsetX = (e.screenX - e.target.getBoundingClientRect().x)
    const initialOffsetY = (e.screenY - e.target.getBoundingClientRect().y)
    this.setState({
      initialOffsetX,
      initialOffsetY,
    })
  }

  handleDrag = (e, data, dX, dY) => {
    const { position } = this.props
    // x, y represent the current drag position
    const { x, y } = data
    // don't consider it to be "dragging" unless you've moved >10 px
    if (Math.abs(x - position.xPos) + Math.abs(y - position.yPos) < 10) {
      return
    }
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
      // dragPosition indicates the x/y of the dragged element, relative to the grid
      // divide by 2 to get center position of the card (instead of top left)
      dragX: x + position.width / 2,
      dragY: y + position.height / 2,
      ...position
    }
    this.props.onDrag(this.props.card.id, dragPosition)
  }

  handleStop = (ev) => {
    this.props.onDragOrResizeStop(this.props.card.id)
    this.setState({ dragging: false, resizing: false })
    const timeoutId = setTimeout(() => {
      // have this item remain "on top" while it animates back
      this.setState({ moveComplete: true })
      uiStore.stopDragging()
    }, 350)
    this.setState({ timeoutId })
  }

  handleResize = (e, dir, ref, delta, position) => {
    if (!this.state.resizing) {
      this.setState({ resizing: true, moveComplete: false })
      uiStore.resetSelectionAndBCT()
      // close the MoveMenu to prevent weird behaviors
      uiStore.closeMoveMenu()
      document.querySelector('.ql-editor p').focus()
    }
    const { gridW, gridH, cols } = uiStore.gridSettings
    const { card } = this.props
    const pad = 0.75
    const newSize = {
      // pad by some so that as you resize it doesn't immediately jump sizes
      width: card.width + Math.floor((delta.width / gridW) + pad),
      height: card.height + Math.floor((delta.height / gridH) + pad),
    }
    // e.g. if card.width is 4, but we're at 2 columns, max out at cardWidth = 2
    newSize.width = Math.max(Math.min(newSize.width, cols), 1)
    // always max out height at 2
    newSize.height = Math.max(Math.min(newSize.height, 2), 1)
    this.props.onResize(this.props.card.id, newSize)
    document.querySelector('.ql-editor p').focus()
  }

  // this function gets passed down to the card, so it can place the onClick handler
  handleClick = (e) => {
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
    <PositionedGridCard
      {...this.styleProps()}
      transition={cardCSSTransition}
    >
      <GridCardEmpty
        card={this.props.card}
        dragging={this.state.dragging}
        showHotspot={beginningOfRow}
      />
    </PositionedGridCard>
  )

  renderBlank = () => {
    const { parent } = this.props
    const styleProps = this.styleProps()
    const {
      height,
      xPos,
      yPos
    } = styleProps

    return (
      <FlipMove
        easing="ease-out"
        appearAnimation={{
          from: {
            transform: `scaleX(0) scaleY(0)`,
            transformOrigin: `${xPos}px ${yPos}px`
          },
          to: {
            transform: `scaleX(1) scaleY(1)`,
            transformOrigin: `${xPos}px ${yPos}px`
          },
        }}
      >
        <div>
          <PositionedGridCard {...styleProps}>
            <GridCardBlank height={height} parent={parent} />
          </PositionedGridCard>
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

    const {
      dragging,
      resizing,
      moveComplete
    } = this.state

    if (cardType === 'placeholder') {
      return this.renderPlaceholder()
    } else if (cardType === 'blank') {
      return this.renderBlank()
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
        if (this.state.initialOffsetX > 200) {
          xAdjust = this.state.initialOffsetX * 0.25
        }
        width *= 0.8
      }
      if (height > 500) {
        if (this.state.initialOffsetY > 200) {
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

    return (
      <StyledCardWrapper dragging={!moveComplete}>
        <Rnd
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

          cancel=".no-drag"

          size={{ width, height }}
          position={{ x: xPos, y: yPos }}
          default={{ width, height, x: xPos, y: yPos }}
          disableDragging={
            !canEditCollection ||
            // NOTE: disabling dragging for touchscreens because of conflict with touch scrolling
            (uiStore.isTouchDevice && cols === 1) ||
            card.isPinnedAndLocked
          }
          enableResizing={{
            bottomRight: canEditCollection && !card.isPinnedAndLocked &&
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
              )
            }
          }}

          style={{
            // animate grid items that are moving as they're being displaced
            transition: ((dragging || resizing) ? 'none' : cardCSSTransition),
          }}

        >
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: dragging ? `translate(${xAdjust}px, ${yAdjust}px) rotate(3deg)` : '',
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
