// import { Meteor } from 'meteor/meteor'
import React from 'react'
import _ from 'lodash'

import DraggableGridItem from '~/ui/grid/DraggableGridItem'

const calculateDistance = (pos1, pos2) => {
  // pythagoras!
  const a = pos2.x - pos1.x
  const b = pos2.y - pos1.y
  return Math.sqrt((a * a) + (b * b))
}

class CollectionGrid extends React.PureComponent {
  state = {
    cards: [...this.props.cards],
    positionedItems: [],
    timeoutId: null
  }

  componentWillMount() {
    this.positionItems()
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ cards: nextProps.cards }, () => {
      this.positionItems()
    })
  }

  onDrag = (itemId, dragPosition) => {
    const draggedItem = _.find(this.state.positionedItems, { id: itemId })
    const phKey = `${itemId}-ph`
    const stateItems = [...this.state.cards]
    let placeholder = _.find(stateItems, { id: phKey })
    const hoveringOver = this.findOverlap(itemId, dragPosition)
    if (!placeholder) {
      placeholder = {
        ...draggedItem,
        order: (draggedItem.order - 1),
        id: phKey,
        type: 'placeholder'
      }
      const newItems = _.concat(stateItems, placeholder)
      this.setState({ cards: newItems }, () => {
        this.positionItems({ dragging: draggedItem.id, position: draggedItem.position })
      })
    } else if (hoveringOver) {
      const { direction } = hoveringOver
      const hoveringItem = hoveringOver.item
      const newOrder = hoveringItem.order + (direction === 'left' ? -1 : 1)
      if (placeholder.order !== newOrder) {
        // this should modify stateItems in place?
        placeholder.order = newOrder
        // NOTE: delay is for not having flickery drag placeholders
        // -- adding the clearTimeout seems to make it behave fine
        const timeoutId = setTimeout(() => {
          this.setState({ cards: stateItems }, () => {
            this.positionItems({
              dragging: draggedItem.id,
              position: draggedItem.position,
              cursor: { x: dragPosition.dragX, y: dragPosition.dragY }
            })
          })
        }, 330)
        this.clearTimeout()
        this.setState({ timeoutId })
      }
    }
  }

  onDragStop = () => {
    const placeholder = _.find(this.state.positionedItems, { type: 'placeholder' }) || {}
    const original = _.find(this.state.positionedItems, { id: placeholder.itemId })
    this.clearTimeout()
    if (!placeholder || !original) return
    const moved = (
      !_.isEqual(placeholder.position, original.position) ||
      Math.abs(placeholder.order - original.order) > 10
    )
    if (moved) {
      // const { parentId } = this.props
      // // we want to drop this item on the order where placeholder is already sitting
      // const { order } = placeholder
      // // itemId stores the original itemId not the phKey
      // // calling updateItem will also reset this.state.cards
      // Meteor.call('updateItem', parentId, placeholder.itemId, { order })
      console.log('moved', moved)
    } else {
      // reset back to normal
      this.setState({
        cards: [...this.props.cards]
      })
    }
  }

  clearTimeout = () => {
    if (this.state.timeoutId) {
      clearTimeout(this.state.timeoutId)
      this.setState({ timeoutId: null })
    }
  }

  findOverlap = (itemId, dragPosition) => {
    let hoveringOver = null
    const { dragX, dragY } = dragPosition
    const distances = _.map(this.state.positionedItems, item => {
      if (item.id === itemId || item.type === 'placeholder') return null
      // only run this check if we're within the reasonable row bounds
      if (item.position.yPos <= dragY && item.position.yPos + item.position.height >= dragY) {
        const mousePos = { x: dragX, y: dragY }
        // centered itemPos
        const itemPos = {
          x: item.position.xPos + (item.position.width / 2),
          y: item.position.yPos + (item.position.height / 2)
        }
        const distance = calculateDistance(mousePos, itemPos)
        let direction = 'left'
        if (mousePos.x - itemPos.x > item.position.width / 4 ||
          mousePos.y - itemPos.y > item.position.height / 4 ||
          (mousePos.x > itemPos.x && mousePos.y > itemPos.y)) {
          direction = 'right'
        }
        return { ...item, distance, direction }
      }
      return null
    })
    const closest = _.first(_.sortBy(distances, 'distance'))
    if (closest) {
      hoveringOver = { item: closest, direction: closest.direction }
    }
    return hoveringOver
  }

  positionItems = (opts = {}) => {
    const {
      gridW,
      gridH,
      gutter,
      cols
    } = this.props
    let row = 0
    // let col = 0
    const matrix = []
    const positionedItems = []
    // create an empty row
    matrix.push(_.fill(Array(cols), null))
    _.each(_.sortBy(this.state.cards, 'order'), item => {
      if (opts.dragging === item.id) {
        const { position } = opts
        const positionedItem = { ...item, position }
        positionedItems.push(positionedItem)
        return
      }

      let position = {}
      let filled = false
      // TODO: remove row < 100 constraint, was just to prevent bad looping
      while (!filled && row < 100) {
        let itFits = false
        let gap = 0
        let nextX = 0
        // go through the row and see if there is an empty gap that fits item.w
        for (let x = 0; x < cols; x += 1) {
          if (matrix[row][x] === null) {
            gap += 1
          } else {
            gap = 0
          }
          if (gap >= item.width) {
            // jump back the number of spaces to the opening of the gap
            nextX = (x + 1) - item.width
            itFits = true
            break
          }
        }
        if (itFits) {
          filled = true
          position = {
            x: nextX,
            y: row
          }
          _.assign(position, {
            xPos: position.x * (gridW + gutter),
            yPos: position.y * (gridH + gutter),
            width: (item.width * (gridW + gutter)) - gutter,
            height: (item.height * (gridH + gutter)) - gutter,
          })

          // fill rows and columns
          _.fill(matrix[row], item.id, position.x, position.x + item.width)
          for (let y = 1; y < item.height; y += 1) {
            if (!matrix[row + y]) matrix.push(_.fill(Array(cols), null))
            _.fill(matrix[row + y], item.id, position.x, position.x + item.width)
          }

          // NOTE: if you remove this check, then it will fill things in
          // slightly out of order to "fill empty gaps"
          if (nextX + item.w === cols) {
            row += 1
            if (!matrix[row]) matrix.push(_.fill(Array(cols), null))
          }
          //  --------

          const positionedItem = { ...item, position }
          positionedItems.push(positionedItem)
        } else {
          row += 1
          if (!matrix[row]) matrix.push(_.fill(Array(cols), null))
        }
      }
    })
    // console.log(positionedItems)
    this.setState({ positionedItems })
  }

  renderPositionedItems = () => {
    const grid = []

    // unnecessary? we seem to need to preserve the array order
    // in order to not re-draw divs (make transform animation work)
    // so that's why we do this second pass to actually create the divs in their original order
    _.each(this.state.cards, originalItem => {
      const item = _.find(this.state.positionedItems, { id: originalItem.id })
      if (_.isEmpty(item)) return
      grid.push(
        <DraggableGridItem
          key={item.id}
          position={item.position}
          onDrag={this.onDrag}
          onDragStop={this.onDragStop}
          onHotspotHover={this.onHotspotHover}
          add={this.props.add}
          {...item}
        />
      )
    })
    return grid
  }

  render() {
    return (
      <div className="Grid">
        { this.renderPositionedItems() }
      </div>
    )
  }
}

export default CollectionGrid
