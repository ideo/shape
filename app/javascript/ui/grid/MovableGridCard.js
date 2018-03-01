import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import FlipMove from 'react-flip-move'
import Rnd from 'react-rnd'

import { uiStore } from '~/stores'
import v from '~/utils/variables'
import propShapes from '~/utils/propShapes'
import PositionedGridCard from '~/ui/grid/PositionedGridCard'
import GridCard from '~/ui/grid/GridCard'
import GridCardPlaceholder from '~/ui/grid/GridCardPlaceholder'
import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'

class MovableGridCard extends React.PureComponent {
  state = {
    timeoutId: null,
    // this is really just used so that it will reset when you finish dragging
    dragging: false,
    dragComplete: true,
    zIndex: 1,
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
    this.setState({
      dragging: true,
      dragComplete: false,
      zIndex: 1000,
    })
    const dragPosition = {
      // dragPosition indicates the x/y of the dragged element, relative to the grid
      // divide by 2 to get center position of the card (instead of top left)
      dragX: x + position.width / 2,
      dragY: y + position.height / 2,
      ...position
    }
    this.props.onDrag(this.props.card.id, dragPosition)
  }

  handleStop = () => {
    this.props.onMoveStop(this.props.card.id)
    this.setState({ dragging: false })
    const timeoutId = setTimeout(() => {
      // have this item remain "on top" while it animates back
      this.setState({ zIndex: 1, dragComplete: true })
    }, 350)
    this.setState({ timeoutId })
  }

  handleResize = (e, dir, ref, delta, position) => {
    const { gridW, gridH } = uiStore.gridSettings
    this.setState({
      zIndex: 1000,
    })
    const { card } = this.props
    const newSize = {
      width: card.width + Math.floor((delta.width + 200) / gridW),
      height: card.height + Math.floor((delta.height + 200) / gridH),
    }
    newSize.width = Math.max(newSize.width, 1)
    newSize.height = Math.max(newSize.height, 1)
    // console.log(newSize)
    this.props.onResize(this.props.card.id, newSize)
  }

  // this function gets passed down to the card, so it can place the onClick handler
  handleClick = () => {
    const { cardType, record } = this.props
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

  render() {
    const {
      card,
      cardType,
      record,
      position
    } = this.props

    const { gridW, gridH, gutter } = uiStore.gridSettings
    const maxWidth = (gridW * 4) + (gutter * 3)
    const maxHeight = (gridH * 2) + gutter

    const isPlaceholder = cardType === 'placeholder'
    const isBlank = cardType === 'blank'

    const {
      xPos,
      yPos
    } = position
    let {
      height,
      width
    } = position

    let xAdjust = 0
    let yAdjust = 0

    // const transition = 'transform 0.5s, width 0.3s, height 0.3s;'
    let { zIndex } = this.state
    const { dragging } = this.state
    if (dragging) {
      // transition = 'width 0.3s, height 0.3s;'
      // experiment -- shrink wide and tall cards
      // NOTE: turned off, was causing other issues about card placement
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
    if (isPlaceholder) {
      zIndex = 0
      // transition = 'none'
    }
    let outline = ''
    if (card.hoveringOver) {
      // outline = `outline: 3px dashed ${v.colors.teal};`
      outline = `3px dashed ${v.colors.teal}`
    }

    const cardProps = {
      card,
      cardType,
      record,
      // useful for sub-components to know about the card's height
      height,
      // we want to track "dragging" until the transition is complete
      // also so that click handler doesn't register while dragging
      dragging: !this.state.dragComplete,
      handleClick: this.handleClick,
    }
    const styleProps = {
      width,
      height,
      xPos,
      yPos,
      // transition,
    }

    // const bounds = {
    //   left: (-50 + (xPos * -1)),
    //   // TODO: `1200` would come from some viewport width
    //   right: (1400 - (width / 2)) - xPos
    // }

    const z = zIndex

    if (isPlaceholder) {
      return (
        <PositionedGridCard {...styleProps}>
          <GridCardPlaceholder />
        </PositionedGridCard>
      )
    } else if (isBlank) {
      styleProps.transition = 'none'
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
              <GridCardBlank height={height} parent={this.props.parent} order={card.order} />
            </PositionedGridCard>
          </div>
        </FlipMove>
      )
    }

    return (
      <div
        style={{
          zIndex: (dragging && !isPlaceholder) ? (z * 2) : z,
          position: 'relative'
        }}
      >
        <FlipMove
          appearAnimation={isPlaceholder ? null : 'elevator'}
          typeName={null}
        >
          <Rnd
            bounds={null}
            onDragStart={this.handleStart}
            onDrag={this.handleDrag}
            onDragStop={this.handleStop}

            onResizeStart={this.handleStart}
            onResize={this.handleResize}
            onResizeStop={this.handleStop}

            maxWidth={maxWidth}
            maxHeight={maxHeight}

            cancel=".no-drag"

            size={{ width, height }}
            position={{ x: xPos, y: yPos }}
            // position={this.state.position}
            default={{ width, height, x: xPos, y: yPos }}
            enableResizing={{
              bottomRight: true,
              bottom: false,
              bottomLeft: false,
              left: false,
              right: false,
              top: false,
              topLeft: false,
              topRight: false,
            }}
            // resizeGrid={resizeGrid}
            resizeHandleStyles={{
              bottomRight: {
                display: dragging ? 'none' : 'block',
                position: 'absolute',
                zIndex: 1000,
                bottom: 0,
                right: 0,
                width: 50,
                height: 50,
                background: 'red',
              }
            }}
            style={{
              outline,
              // animate grid items that are moving as they're being displaced
              transition: dragging ? 'none' : 'transform 0.25s',
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

        </FlipMove>
      </div>
    )
  }
}

MovableGridCard.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  cardType: PropTypes.string.isRequired,
  position: PropTypes.shape(propShapes.position).isRequired,
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  onDrag: PropTypes.func.isRequired,
  onResize: PropTypes.func.isRequired,
  onMoveStop: PropTypes.func.isRequired,
  routeTo: PropTypes.func.isRequired,
}

export default MovableGridCard
