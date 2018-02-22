import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import FlipMove from 'react-flip-move'
import Draggable from 'react-draggable'

import v from '~/utils/variables'
import propShapes from '~/utils/propShapes'
import PositionedGridCard from '~/ui/grid/PositionedGridCard'
import GridCard from '~/ui/grid/GridCard'
import GridCardPlaceholder from '~/ui/grid/GridCardPlaceholder'
import GridCardBlank from '~/ui/grid/GridCardBlank'

class MovableGridCard extends React.PureComponent {
  state = {
    timeoutId: null,
    // this is really just used so that it will reset when you finish dragging
    position: { x: 0, y: 0 },
    dragging: false,
    dragComplete: true,
    zIndex: 1,
    // track where on the page the mouse position is, e.g. if browser is stretched wide
    // initialOffsetX: 0,
    // initialOffsetY: 0,
    target: null
  }

  componentWillUnmount() {
    this.clearDragTimeout()
  }

  handleStart = (e, data) => {
    // initialOffset tracks the coordinates *within* the card where you clicked,
    // e.g. bottom left corner of the card itself
    // const initialOffsetX = (e.screenX - e.target.getBoundingClientRect().x)
    // const initialOffsetY = (e.screenY - e.target.getBoundingClientRect().y)
    this.setState({
      // initialOffsetX,
      // initialOffsetY,
      target: e.target,
    })
  }

  handleDrag = (e, data) => {
    const { position } = this.props
    // x, y represent the drag delta
    const { x, y } = data
    // const { initialOffsetX, initialOffsetY, target } = this.state
    const { target } = this.state
    const offsetX = (e.screenX - target.getBoundingClientRect().x)
    const offsetY = (e.screenY - (target.getBoundingClientRect().y + 100))
    // console.log(e.screenY, target.getBoundingClientRect().y)
    if (Math.abs(x) + Math.abs(y) < 5) {
      return
    }
    this.setState({
      dragging: true,
      dragComplete: false,
      zIndex: 1000,
    })
    const dragPosition = {
      // dragPosition indicates the x/y of the dragged element,
      // relative to the grid
      dragX: x + offsetX + position.xPos,
      dragY: y + offsetY + position.yPos,
      ...position
    }
    // console.log(position.xPos, position.yPos, dragPosition)
    this.props.onDrag(this.props.card.id, dragPosition)
  }

  handleStop = () => {
    if (this.state.dragging) {
      this.props.onDragStop(this.props.card.id)
      this.setState({ dragging: false })
      const timeoutId = setTimeout(() => {
        // have this item remain "on top" while it animates back
        this.setState({ zIndex: 1, dragComplete: true })
      }, 350)
      this.setState({ timeoutId })
    }
  }

  handleClick = () => {
    const { cardType, record } = this.props
    if (cardType === 'collections') {
      // timeout is just a stupid thing so that Draggable doesn't complain about unmounting
      setTimeout(() => {
        this.props.routeTo('collections', record.id)
      })
    }
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

    const isPlaceholder = cardType === 'placeholder'
    const isBlank = cardType === 'blank'

    const {
      xPos,
      yPos,
      height,
      width
    } = position

    const transition = 'transform 0.5s, width 0.3s, height 0.3s;'
    let rotation = '0deg'
    let { zIndex } = this.state
    const { dragging } = this.state
    if (dragging) {
      // transition = 'width 0.3s, height 0.3s;'
      // experiment -- shrink wide and tall cards
      // NOTE: turned off, was causing other issues about card placement
      // if (width > 500) {
      //   if (this.state.initialOffsetX > 200) {
      //     xPos += this.state.initialOffsetX * 0.5
      //   }
      //   width *= 0.6
      // }
      // if (height > 400) {
      //   if (this.state.initialOffsetY > 200) {
      //     yPos += this.state.initialOffsetY * 0.5
      //   }
      //   height *= 0.6
      // }
      rotation = '3deg'
    }
    if (isPlaceholder) {
      zIndex = 0
      // transition = 'none'
      rotation = '0deg'
    }
    let outline = ''
    if (card.hoveringOver) {
      outline = `outline: 3px dashed ${v.colors.teal};`
    }

    const cardProps = {
      card,
      cardType,
      record,
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
      rotation,
      transition,
      outline,
    }

    const bounds = {
      left: (-50 + (xPos * -1)),
      // TODO: `1200` would come from some viewport width
      right: (1400 - (width / 2)) - xPos
    }

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
              <GridCardBlank parent={this.props.parent} order={card.order} />
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
          <Draggable
            bounds={bounds}
            onStart={this.handleStart}
            onDrag={this.handleDrag}
            onStop={this.handleStop}
            position={this.state.position}
          >
            {/*
              intermediary div is necessary so that we can apply our own transforms
              and not be overridden by Draggable
            */}
            <div>
              <PositionedGridCard {...styleProps}>
                <GridCard {...cardProps} />
              </PositionedGridCard>
            </div>
          </Draggable>

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
  onDragStop: PropTypes.func.isRequired,
  routeTo: PropTypes.func.isRequired,
}

export default MovableGridCard
