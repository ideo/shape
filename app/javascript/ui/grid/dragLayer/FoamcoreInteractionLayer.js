import _ from 'lodash'
import PropTypes from 'prop-types'
import { action, observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import CollectionCard from '~/stores/jsonApi/CollectionCard'
import { ROW_ACTIONS } from '~/stores/jsonApi/Collection'
import PositionedBlankCard from '~/ui/grid/dragLayer/PositionedBlankCard'
import FoamcoreHotEdge from '~/ui/grid/FoamcoreHotEdge'
import { isFile } from '~/utils/FilestackUpload'
import v, { FOAMCORE_INTERACTION_LAYER } from '~/utils/variables'

const DragLayerWrapper = styled.div`
  height: 100%;
  width: 100%;
  z-index: ${v.zIndex.gridCardTop};
`

@inject('apiStore', 'uiStore')
@observer
class FoamcoreInteractionLayer extends React.Component {
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

  onCursorMove = type => ev => {
    const { coordinatesForPosition } = this.props
    let rect = { left: 0, top: 0 }
    const container = document.querySelector(`.${FOAMCORE_INTERACTION_LAYER}`)
    if (container) {
      // just a guard for jest shallow render
      rect = container.getBoundingClientRect()
    }

    let { clientX, clientY, target } = ev
    if (type === 'touch' && ev.touches) {
      const touch = _.first(ev.touches)
      // Check if touch device and make sure touch event has real data
      if (touch && touch.clientX && touch.clientY) {
        clientX = touch.clientX
        clientY = touch.clientY
        target = touch.target
      }
    }
    const { classList } = target
    if (!classList || !_.includes(classList, FOAMCORE_INTERACTION_LAYER)) {
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

  onCreateBct = ({ row, col, create = false }, contentType) => {
    const { selectedAreaMinX } = this
    const { apiStore, uiStore, collection } = this.props

    // If user is selecting an area, don't trigger blank card click
    if (selectedAreaMinX) {
      return
    }

    uiStore.openBlankContentTool({
      row,
      col,
      collectionId: collection.id,
      blankType: contentType,
    })
    runInAction(() => {
      this.hoveringRowCol = { row: null, col: null }
    })

    if (create) {
      const placeholder = new CollectionCard(
        {
          row,
          col,
          parent_id: collection.id,
        },
        apiStore
      )
      placeholder.API_createBct()
    }
  }

  handleInsertRowClick = (ev, row) => {
    return this.onRowClick(ev, row, ROW_ACTIONS.INSERT)
  }

  handleRemoveRowClick = (ev, row) => {
    return this.onRowClick(ev, row, ROW_ACTIONS.REMOVE)
  }

  onRowClick = async (ev, row, action) => {
    ev.stopPropagation()
    const { collection, uiStore } = this.props
    if (uiStore.isTransparentLoading) {
      return false
    }
    collection.API_manipulateRow({ row, action })
  }

  positionBlank = ({ row, col, width, height }, interactionType = 'drag') => {
    let emptyRow = false
    if (interactionType === 'hover') {
      const {
        collection: { collection_cards },
      } = this.props

      emptyRow =
        !_.some(collection_cards, { row }) &&
        !_.some(collection_cards, { row: row - 1, height: 2 })
    }

    return this.renderBlankCard(
      { row, col, width, height, emptyRow },
      interactionType
    )
  }

  @action
  repositionBlankCard = ({ row, col }) => {
    const prevRow = this.hoveringRowCol.row
    const prevCol = this.hoveringRowCol.col
    if (row === prevRow && col === prevCol) {
      return
    }
    if (!row || !col) return
    this.hoveringRowCol = { row, col }
  }

  renderBlankCard = (
    { row, col, width, height, emptyRow = false },
    interactionType
  ) => {
    const { uiStore, collection, hasDragCollision } = this.props
    const position = uiStore.positionForCoordinates({ col, row, width, height })
    const {
      blankContentToolState: { replacingId },
    } = uiStore

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
        emptyRow={emptyRow}
        replacingId={replacingId}
        /* Why is this rendering on top of a collection? */
        blocked={hasDragCollision && isDrag}
        data-blank-type={interactionType}
        // this is to make it work the same as CollectionGrid BCT for cypress
        className={`StyledHotspot-${row}:${col}-BCT`}
        handleBlankCardClick={this.onCreateBct}
        handleInsertRowClick={this.handleInsertRowClick}
        handleRemoveRowClick={this.handleRemoveRowClick}
        data-empty-space-click
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
    const { uiStore } = this.props
    const { blankContentToolState } = uiStore
    const { row, col } = this.hoveringRowCol

    if (
      row !== null &&
      col !== null &&
      (blankContentToolState.row !== row || blankContentToolState.col !== col)
    ) {
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

  get renderHotEdges() {
    const { collection, relativeZoomLevel, maxRow } = this.props
    const {
      cardMatrix,
      collection_cards,
      num_columns,
      isFourWideBoard,
    } = collection
    // rows start at 0, plus add an extra at the bottom
    const newMaxRow = maxRow + 1
    const pinnedCardMaxRow = (
      _.maxBy(_.filter(collection_cards, 'isPinnedAndLocked'), 'row') || {
        row: -1,
      }
    ).row
    const hotEdges = []
    _.each(_.range(0, newMaxRow), row => {
      _.each(_.range(0, num_columns), col => {
        if (!cardMatrix[row] || !cardMatrix[row][col]) {
          // continue iteration
          return true
        }
        // find two cards together UNLESS the card on the right isPinnedAndLocked
        const twoCardsTogether =
          col > 0 &&
          !cardMatrix[row][col].isPinnedAndLocked &&
          cardMatrix[row][col - 1] &&
          cardMatrix[row][col - 1] !== cardMatrix[row][col]
        if (col === 0 || twoCardsTogether) {
          hotEdges.push(
            <FoamcoreHotEdge
              key={`hotspot-${row}:${col}`}
              relativeZoomLevel={relativeZoomLevel}
              row={row}
              col={col}
              horizontal={false}
              onClick={() => {
                this.onCreateBct({ col, row, create: true })
              }}
            />
          )
        }
      })
      if (isFourWideBoard && pinnedCardMaxRow <= row) {
        // only 4WFC has horizontal hot edges in the row gutters
        hotEdges.push(
          <FoamcoreHotEdge
            key={`hotspot-${row}`}
            relativeZoomLevel={relativeZoomLevel}
            row={row}
            onClick={ev => this.handleInsertRowClick(ev, row)}
            horizontal
          />
        )
      }
    })
    return <div>{hotEdges}</div>
  }

  get renderBct() {
    const { uiStore, collection } = this.props
    const { blankContentToolIsOpen, blankContentToolState } = uiStore
    const { collectionId } = blankContentToolState

    // NOTE: ensure that the bct is open in the same collection
    if (blankContentToolIsOpen && collectionId === collection.id) {
      return this.positionBlank({ ...blankContentToolState }, 'bct')
    }

    return null
  }

  render() {
    const { uiStore } = this.props

    return (
      <DragLayerWrapper
        data-empty-space-click
        className={FOAMCORE_INTERACTION_LAYER}
        onMouseMove={this.onCursorMove('mouse')}
        onTouchStart={this.onCursorMove('touch')}
        onDragOver={e => {
          e.preventDefault()
          this.onCursorMove('mouse')
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
        onMouseLeave={e => {
          e.preventDefault()
          uiStore.setDroppingFiles(false)
        }}
      >
        {this.renderInnerDragLayer}
        {this.renderHotEdges}
        {this.renderBct}
      </DragLayerWrapper>
    )
  }
}

FoamcoreInteractionLayer.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  coordinatesForPosition: PropTypes.func.isRequired,
  hoveringOverCollection: PropTypes.bool.isRequired,
  dragging: PropTypes.bool.isRequired,
  resizing: PropTypes.bool.isRequired,
  hasDragCollision: PropTypes.bool.isRequired,
  relativeZoomLevel: PropTypes.number.isRequired,
  maxRow: PropTypes.number.isRequired,
}

FoamcoreInteractionLayer.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default FoamcoreInteractionLayer
