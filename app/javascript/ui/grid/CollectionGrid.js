import { observer } from 'mobx-react'
import _ from 'lodash'

import DraggableGridCard from '~/ui/grid/DraggableGridCard'

const calculateDistance = (pos1, pos2) => {
  // pythagoras!
  const a = pos2.x - pos1.x
  const b = pos2.y - pos1.y
  return Math.sqrt((a * a) + (b * b))
}

// needs to be an observer to observe changes to the collection + items
@observer
class CollectionGrid extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      cards: [],
      timeoutId: null
    }
  }

  componentDidMount() {
    this.positionCards(this.props.collection.collection_cards)
  }

  componentWillReceiveProps(nextProps) {
    // console.log('Grid: nextProps', nextProps)
    this.positionCards(nextProps.collection.collection_cards)
  }

  // componentWillUpdate(nextProps, nextState, nextContext) {
  //   console.log(nextProps, nextState, nextContext)
  // }

  // --------------------------
  // <Drag related functions>
  // --------------------------
  onDrag = (cardId, dragPosition) => {
    const positionedCard = _.find(this.state.cards, { id: cardId })
    const placeholderKey = `${cardId}-placeholder`
    const stateCards = [...this.state.cards]
    let placeholder = _.find(stateCards, { id: placeholderKey })
    const hoveringOver = this.findOverlap(cardId, dragPosition)
    if (!placeholder) {
      placeholder = {
        position: positionedCard.position,
        width: positionedCard.width,
        height: positionedCard.height,
        // better way to do this??
        order: (positionedCard.order - 1),
        id: placeholderKey,
        originalId: cardId,
        cardType: 'placeholder'
      }
      const newItems = _.concat(stateCards, placeholder)
      this.positionCards(newItems, { dragging: positionedCard.id })
    } else if (hoveringOver) {
      const { direction, order } = hoveringOver
      const newOrder = parseFloat(order) + (direction === 'left' ? -0.5 : 0.5)
      if (placeholder.order !== newOrder) {
        // this should modify stateCards in place?
        placeholder.order = newOrder
        // NOTE: delay is for not having flickery drag placeholders
        // -- adding the clearTimeout seems to make it behave better
        const timeoutId = setTimeout(() => {
          this.positionCards(stateCards, { dragging: positionedCard.id })
        }, 500)
        this.clearDragTimeout()
        this.setState({ timeoutId })
      }
    }
  }

  onDragStop = () => {
    const placeholder = _.find(this.state.cards, { cardType: 'placeholder' }) || {}
    const original = _.find(this.state.cards, { id: placeholder.originalId })

    this.clearDragTimeout()
    if (!placeholder || !original) return
    const moved = (
      !_.isEqual(placeholder.position, original.position) ||
      Math.abs(placeholder.order - original.order) > 10
    )
    if (moved) {
      // const { parentId } = this.props
      // // we want to drop this item on the order where placeholder is already sitting
      const { order } = placeholder
      original.order = order
      // stateCards = _.reject(stateCards, { cardType: 'placeholder' })

      this.props.collection.reorderCards()
      this.props.updateCollection()
      this.positionCards(this.props.collection.collection_cards)

      // // cardId stores the original cardId not the placeholderKey
      // // calling updateItem will also reset this.state.cards
      // console.log('moved', order)
    } else {
      // reset back to normal
      // console.log('resetting')
      this.positionCards(this.props.collection.collection_cards)
    }
  }

  clearDragTimeout = () => {
    if (this.state.timeoutId) {
      clearTimeout(this.state.timeoutId)
      this.setState({ timeoutId: null })
    }
  }

  findOverlap = (cardId, dragPosition) => {
    let hoveringOver = null
    const { dragX, dragY } = dragPosition
    const distances = _.map(this.state.cards, card => {
      if (card.id === cardId || card.cardType === 'placeholder') return null
      // only run this check if we're within the reasonable row bounds
      if (card.position.yPos <= dragY && card.position.yPos + card.position.height >= dragY) {
        const mousePos = { x: dragX, y: dragY }
        // centered cardPos
        const cardPos = {
          x: card.position.xPos + (card.position.width / 2),
          y: card.position.yPos + (card.position.height / 2)
        }
        const distance = calculateDistance(mousePos, cardPos)
        let direction = 'left'
        if (mousePos.x - cardPos.x > card.position.width / 4 ||
          mousePos.y - cardPos.y > card.position.height / 4 ||
          (mousePos.x > cardPos.x && mousePos.y > cardPos.y)) {
          direction = 'right'
        }
        // if ((direction === 'right' && cardPos.x > 3) ||
        //   (direction === 'left' && cardPos.x === 0)) {
        //   return null
        // }
        const { order } = card
        return {
          order,
          distance,
          direction,
          record: card.record()
        }
      }
      return null
    })
    const closest = _.first(_.sortBy(distances, 'distance'))
    if (closest) {
      hoveringOver = closest
    }
    return hoveringOver
  }
  // --------------------------
  // </end Drag related functions>
  // --------------------------

  // saveCollectionUpdates = () => {
  //   const { collection } = this.props
  //   collection.save()
  //   // do we have to do any kind of "sync" here?
  //   // presumably we already have the proper data in store...
  // }

  positionCards = (cards, opts = {}) => {
    const {
      gridW,
      gridH,
      gutter,
      cols
    } = this.props
    let row = 0
    const matrix = []
    // create an empty row
    matrix.push(_.fill(Array(cols), null))

    _.each(_.sortBy(cards, 'order'), card => {
      // we don't actually want to "re-position" the dragging card
      // because its position is being determined by the drag (i.e. mouse cursor)
      if (opts.dragging === card.id) {
        return
      }

      let position = {}
      let filled = false
      // find an open row that can fit the current card
      while (!filled) {
        let itFits = false
        let gap = 0
        let nextX = 0
        // go through the row and see if there is an empty gap that fits card.w
        for (let x = 0; x < cols; x += 1) {
          if (matrix[row][x] === null) {
            gap += 1
          } else {
            gap = 0
          }
          if (gap >= card.width) {
            // jump back the number of spaces to the opening of the gap
            nextX = (x + 1) - card.width
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
            width: (card.width * (gridW + gutter)) - gutter,
            height: (card.height * (gridH + gutter)) - gutter,
          })

          // add position attrs to card
          card.position = position

          // fill rows and columns
          _.fill(matrix[row], card.id, position.x, position.x + card.width)
          for (let y = 1; y < card.height; y += 1) {
            if (!matrix[row + y]) matrix.push(_.fill(Array(cols), null))
            _.fill(matrix[row + y], card.id, position.x, position.x + card.width)
          }

          // NOTE: if you remove this check, then it will fill things in
          // slightly out of order to "fill empty gaps" at the end of the row
          if (nextX + card.w === cols) {
            row += 1
            if (!matrix[row]) matrix.push(_.fill(Array(cols), null))
          }
          //  --------
        } else {
          row += 1
          if (!matrix[row]) matrix.push(_.fill(Array(cols), null))
        }
      }
    })
    // update cards in state
    this.setState({ cards })
  }

  renderPositionedCards = () => {
    const grid = []
    // unnecessary? we seem to need to preserve the array order
    // in order to not re-draw divs (make transform animation work)
    // so that's why we do this second pass to actually create the divs in their original order
    _.each(this.state.cards, card => {
      let record = null
      let { cardType } = card
      if (card.cardType !== 'placeholder') {
        // TODO: some kind of error catch if no record?
        const cardRecord = card.record()
        if (cardRecord) {
          record = card.record().rawAttributes()
          cardType = card.record().getRecordType()
        }
      }
      grid.push(
        <DraggableGridCard
          key={card.id}
          card={card}
          cardType={cardType}
          position={card.position}
          record={record}
          onDrag={this.onDrag}
          onDragStop={this.onDragStop}
          onHotspotHover={this.onHotspotHover}
          add={this.props.add}
        />
      )
    })
    return grid
  }

  render() {
    return (
      <div className="Grid">
        { this.renderPositionedCards() }
      </div>
    )
  }
}

export default CollectionGrid
