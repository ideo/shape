import React from 'react'

import Style from 'style-it'
import FlipMove from 'react-flip-move'
import Draggable from 'react-draggable'

import GridItemAtom from '~/ui/grid/GridItemAtom'
import GridItemCollection from '~/ui/grid/GridItemCollection'
import GridItemBlank from '~/ui/grid/GridItemBlank'

class DraggableGridItem extends React.PureComponent {
  state = {
    position: { x: 0, y: 0 },
    dragging: false,
    zIndex: 1,
  }

  handleStart = () => {
    this.setState({ dragging: true, zIndex: 1000 })
  }

  handleDrag = (e) => {
    // console.log('drag', e)
    const { position } = this.props
    const dragPosition = {
      // use position of mouseX / Y
      dragX: e.pageX - 20, // compensate for padding-left: 20px
      dragY: e.pageY - 80, // compensate for padding-top: 80px
      ...position
    }
    this.props.onDrag(this.props.record.id, dragPosition)
  }
  handleStop = () => {
    if (this.props.onDragStop) {
      this.props.onDragStop(this.props.record.id)
    }
    this.setState({ dragging: false })
    setTimeout(() => {
      // have this item remain "on top" while it animates back
      this.setState({ zIndex: 1 })
    }, 350)
  }

  render() {
    const {
      record,
      type,
      position
    } = this.props

    // GridItem setup
    const itemProps = { ...this.props }
    let GridItem = GridItemAtom
    const placeholder = type === 'placeholder'
    const blank = type === 'blank'
    if (type === 'atom') {
      itemProps.atom = record
    } else if (type === 'collection') {
      GridItem = GridItemCollection
      itemProps.collection = record
    } else if (placeholder) {
      GridItem = () => <div />
    } else if (blank) {
      GridItem = GridItemBlank
    }
    //
    const {
      width,
      height,
      xPos,
      yPos
    } = position

    let transition = 'transform 0.5s, opacity 0.5s ease-out 0.2s;'
    let opacity = 1
    let rotation = '0deg'
    const { zIndex } = this.state
    const bounds = {
      left: (-50 + (xPos * -1)),
      // TODO: `1200` would come from some viewport width
      right: (1200 - (width / 2)) - xPos
    }
    if (this.state.dragging) {
      opacity = 0.9
      rotation = '5deg'
    }
    if (placeholder) {
      transition = 'none'
      rotation = '0deg'
    }
    return (
      <FlipMove appearAnimation={placeholder ? null : 'elevator'}>
        <Draggable
          handle=".DragHandle"
          bounds={bounds}
          onStart={this.handleStart}
          onDrag={this.handleDrag}
          onStop={this.handleStop}
          position={this.state.position}
        >
          <div style={{ zIndex, position: 'relative' }}>
            <Style>
              {`
                .PositionedDiv {
                  width: ${width}px;
                  height: ${height}px;
                  transform: translate(${xPos}px, ${yPos}px) rotate(${rotation});
                  transform: translate3d(${xPos}px, ${yPos}px, 0) rotate(${rotation});
                  transition: ${transition};
                  opacity: ${opacity};
                }
              `}
              <div className={`GridItem PositionedDiv ${placeholder ? 'placeholder' : ''}`}>
                <GridItem {...itemProps} />
              </div>
            </Style>
          </div>
        </Draggable>
      </FlipMove>
    )
  }
}

export default DraggableGridItem
