import _ from 'lodash'
import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import PositionedBlankCard from '~/ui/grid/dragLayer/PositionedBlankCard'
import { isFile } from '~/utils/FilestackUpload'
import { FOAMCORE_DRAG_LAYER } from '~/utils/variables'

const DragLayerWrapper = styled.div`
  height: 100%;
  width: 100%;
`

@inject('uiStore')
@observer
class FoamcoreDragLayer extends React.Component {
  @observable
  hoveringRowCol = {
    row: null,
    col: null,
  }

  constructor(props) {
    super(props)
    this.throttledRepositionBlankCard = _.throttle(
      this.repositionBlankCard,
      150
    )
  }

  onCursorMove = ev => {
    const { uiStore, coordinatesForPosition } = this.props

    let rect = { left: 0, top: 0 }
    const container = document.querySelector(`.${FOAMCORE_DRAG_LAYER}`)
    if (container) {
      // just a guard for jest shallow render
      rect = container.getBoundingClientRect()
    }

    let { clientX, clientY, target } = ev
    if (uiStore.isTouchDevice) {
      const touch = _.first(ev.touches)
      clientX = touch.clientX
      clientY = touch.clientY
      target = touch.target
    }
    const { classList } = target
    if (!classList || !_.includes(classList, FOAMCORE_DRAG_LAYER)) {
      // only perform calculation if target is the grid itself
      return true
    }
    const coords = coordinatesForPosition({
      x: clientX - rect.left,
      y: clientY - rect.top,
    })

    const { cardMatrix } = this.props.collection
    let { row, col } = coords
    if (cardMatrix[row] && cardMatrix[row][col]) {
      row = null
      col = null
    }
    this.throttledRepositionBlankCard({ row, col })
    return { row, col }
  }

  positionBlank = ({ row, col, width, height }, interactionType = 'drag') => {
    return this.renderBlankCard({ row, col, width, height }, interactionType)
  }

  @action
  repositionBlankCard = ({ row, col }) => {
    const { uiStore } = this.props
    const { blankContentToolIsOpen } = uiStore
    const prevRow = this.hoveringRowCol.row
    const prevCol = this.hoveringRowCol.col
    if (row === prevRow && col === prevCol) {
      return
    }
    if (blankContentToolIsOpen) {
      uiStore.closeBlankContentTool()
    }
    this.hoveringRowCol = { row, col }
  }

  renderBlankCard = ({ row, col, width, height }, interactionType) => {
    const { uiStore, collection } = this.props
    const position = uiStore.positionForCoordinates({ col, row, width, height })

    // could be drag or drag-overflow
    const isDrag = _.includes(interactionType, 'drag')

    return (
      <PositionedBlankCard
        collection={collection}
        position={position}
        interactionType={interactionType}
        key={`blank-${interactionType}-${row}:${col}`}
        row={row}
        col={col}
        /* Why is this rendering on top of a collection? */
        blocked={this.hasDragCollision && isDrag}
        data-blank-type={interactionType}
        // this is to make it work the same as CollectionGrid BCT for cypress
        className={`StyledHotspot-${row}:${col}-BCT`}
        data-empty-space-click
        // FIXME: what is this used for?
        // draggedOn
      />
    )
  }

  get renderDragSpots() {
    const { hoveringOverCollection, uiStore } = this.props
    const { dragGridSpot, movingCardsOverflow } = uiStore

    if (!dragGridSpot.size || hoveringOverCollection) {
      return
    }

    const draggingPlaceholders = [...dragGridSpot.values()]

    const maxRowCard = _.maxBy(draggingPlaceholders, 'row')
    const maxRow = maxRowCard && maxRowCard.row
    const dragSpots = _.map(draggingPlaceholders, placeholder => {
      placeholder.id = 'drag'
      const atMaxRow =
        placeholder.row === maxRow ||
        placeholder.row + placeholder.height - 1 === maxRow
      if (movingCardsOverflow && atMaxRow) {
        placeholder.id = 'drag-overflow'
      }
      return this.positionBlank(placeholder, placeholder.id)
    })

    return dragSpots
  }

  get renderHoveringSpot() {
    const { row, col } = this.hoveringRowCol

    if (row !== null && col !== null) {
      return this.positionBlank(
        {
          id: 'hover',
          row,
          col,
          width: 1,
          height: 1,
        },
        'hover'
      )
    }
  }

  get renderResizeSpot() {
    const { uiStore } = this.props
    const { placeholderSpot } = uiStore
    const { row, col, width, height } = placeholderSpot

    if (row !== null && col !== null) {
      return this.positionBlank(
        {
          id: 'resize',
          row,
          col,
          width,
          height,
        },
        'resize'
      )
    }
  }

  cardWithinViewPlusPage = card => {
    const { uiStore } = this.props
    // Select all cards that are within view,
    // plus half a screen on any side
    const rows = uiStore.visibleRows
    const cols = uiStore.visibleCols

    const numRows = Math.ceil(rows.num)
    const numCols = Math.ceil(cols.num)

    const withinCols =
      card.col > cols.min - numCols && card.col < cols.max + numCols
    const withinRows =
      card.row > rows.min - numRows && card.row < rows.max + numRows

    return withinRows && withinCols
  }

  get renderDropSpots() {
    const { collection, uiStore } = this.props
    const { cardMatrix } = collection
    const blankCards = []
    // Add blank cards to all empty spaces,
    // and 2x screen heights at the bottom
    let extraRows = 0
    if (collection.isSplitLevel) {
      extraRows = 1
    } else {
      extraRows = uiStore.visibleRows.num * 2
    }
    _.each(_.range(0, collection.max_row_index + extraRows), row => {
      _.each(_.range(0, collection.num_columns), col => {
        // If there's no row, or nothing in this column, add a blank card for this spot
        const blankCard = { row, col, width: 1, height: 1 }
        if (!cardMatrix[row] || !cardMatrix[row][col]) {
          if (this.cardWithinViewPlusPage(blankCard)) {
            blankCards.push(this.positionBlank(blankCard, 'hover'))
          }
        }
      })
    })
    return blankCards
  }

  get renderInnerDragLayer() {
    const { uiStore, dragging, resizing } = this.props

    const { droppingFiles } = uiStore

    if (dragging && !resizing && !droppingFiles) {
      return this.renderDragSpots
    } else if (resizing && !droppingFiles) {
      return this.renderResizeSpot
    } else if (droppingFiles) {
      return this.renderDropSpots
    }

    return this.renderHoveringSpot
  }

  render() {
    const { uiStore } = this.props

    return (
      <DragLayerWrapper
        data-empty-space-click
        className={FOAMCORE_DRAG_LAYER}
        onMouseMove={!uiStore.isTouchDevice ? this.onCursorMove : null}
        onTouchStart={uiStore.isTouchDevice ? this.onCursorMove : null}
        onDragOver={e => {
          e.preventDefault()
          this.onCursorMove(e)
          uiStore.setDroppingFiles(isFile(e.dataTransfer))
        }}
        onDragLeave={e => {
          e.preventDefault()
          if (
            !!(
              e.target.getAttribute &&
              e.target.getAttribute('data-empty-space-click')
            ) ||
            e.target.closest('.dropzoneHolder') ||
            e.target.closest('.gridCardDropzone')
          ) {
            return
          }
          uiStore.setDroppingFiles(false)
        }}
      >
        {this.renderInnerDragLayer}
      </DragLayerWrapper>
    )
  }
}

FoamcoreDragLayer.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  coordinatesForPosition: PropTypes.func.isRequired,
  hoveringOverCollection: PropTypes.bool.isRequired,
  dragging: PropTypes.bool.isRequired,
  resizing: PropTypes.bool.isRequired,
}

FoamcoreDragLayer.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default FoamcoreDragLayer
