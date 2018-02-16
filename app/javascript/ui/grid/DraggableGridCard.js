import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import Style from 'style-it'
import FlipMove from 'react-flip-move'
import Draggable from 'react-draggable'
import ReactHoverObserver from 'react-hover-observer'

import v from '~/utils/variables'
import propShapes from '~/utils/propShapes'
import GridCard from '~/ui/grid/GridCard'
import GridCardPlaceholder from '~/ui/grid/GridCardPlaceholder'

class DraggableGridCard extends React.PureComponent {
  state = {
    timeoutId: null,
    // this is really just used so that it will reset when you finish dragging
    position: { x: 0, y: 0 },
    dragging: false,
    zIndex: 1,
    // track where on the page the mouse position is, e.g. if browser is stretched wide
    initialOffsetX: 0,
    initialOffsetY: 0,
    target: null
  }

  // componentWillReceiveProps(nextProps) {
  //   console.log(nextProps)
  // }

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
        this.setState({ zIndex: 1 })
      }, 350)
      this.setState({ timeoutId })
    } else {
      this.handleClick()
    }
  }

  handleClick = () => {
    const { cardType, record } = this.props
    if (cardType === 'collections') {
      // timeout is just a stupid thing so that Draggable doesn't complain about unmounting
      setTimeout(() => {
        this.props.routeTo(`/collections/${record.id}`)
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

    const placeholder = cardType === 'placeholder'

    const {
      xPos,
      yPos,
      height,
      width
    } = position

    const transition = 'transform 0.5s, width 0.3s, height 0.3s, opacity 0.5s ease-out 0.2s;'
    let opacity = 1
    let rotation = '0deg'
    let { zIndex } = this.state
    const { dragging } = this.state
    if (dragging) {
      // transition = 'width 0.3s, height 0.3s, opacity 0.5s ease-out 0.2s;'
      opacity = 0.9
      // arbitrary -- shrink wide and tall cards
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
      //   height *= 0.7
      // }
      rotation = '3deg'
    }
    if (placeholder) {
      zIndex = 0
      // transition = 'none'
      rotation = '0deg'
    }
    let outline = ''
    if (card.hoveringOver) {
      outline = `outline: 1px dashed ${v.colors.teal};`
    }

    const cardProps = {
      card,
      cardType,
      record,
      dragging,
    }

    const bounds = {
      left: (-50 + (xPos * -1)),
      // TODO: `1200` would come from some viewport width
      right: (1400 - (width / 2)) - xPos
    }

    const z = zIndex

    return (
      <ReactHoverObserver>
        {/* this isHovering wrapper is so that the Hotspots have max zIndex when you hover */}
        {({ isHovering }) => (
          <div
            style={{
              zIndex: ((isHovering || dragging) && !placeholder) ? (z * 2) : z,
              position: 'relative'
            }}
          >
            <FlipMove
              appearAnimation={placeholder ? null : 'elevator'}
              typeName={null}
            >
              <Draggable
                bounds={bounds}
                onStart={this.handleStart}
                onDrag={this.handleDrag}
                onStop={this.handleStop}
                position={this.state.position}
              >
                <div>
                  {/*
                    intermediary div is necessary so that we can apply our own transforms
                    and not be overridden by Draggable
                  */}
                  <Style>
                    {`
                      .PositionedDiv {
                          position: absolute;
                          width: ${width}px;
                          height: ${height}px;
                          transform: translate(${xPos}px, ${yPos}px) rotate(${rotation});
                          transform: translate3d(${xPos}px, ${yPos}px, 0) rotate(${rotation});
                          transition: ${transition};
                          opacity: ${opacity};
                          ${outline}
                        }
                    `}
                    <div className="PositionedDiv">
                      {
                        placeholder
                          ? <GridCardPlaceholder />
                          : <GridCard {...cardProps} />
                      }
                    </div>
                  </Style>
                </div>
              </Draggable>

            </FlipMove>
          </div>
        )}
      </ReactHoverObserver>
    )
  }
}

DraggableGridCard.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  cardType: PropTypes.string.isRequired,
  position: PropTypes.shape(propShapes.position).isRequired,
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  onDrag: PropTypes.func.isRequired,
  onDragStop: PropTypes.func.isRequired,
  routeTo: PropTypes.func.isRequired,
}

export default DraggableGridCard
