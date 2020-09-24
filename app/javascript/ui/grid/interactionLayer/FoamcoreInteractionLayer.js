import _ from 'lodash'
import PropTypes from 'prop-types'
import { action, observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import {
  calculateOpenSpotMatrix,
  findClosestOpenSpot,
} from '~/utils/CollectionGridCalculator'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import { ROW_ACTIONS } from '~/stores/jsonApi/Collection'
import RowActions from './RowActions'
import PositionedBlankCard from '~/ui/grid/interactionLayer/PositionedBlankCard'
import FoamcoreHotEdge from '~/ui/grid/FoamcoreHotEdge'
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
  @observable
  touchSwiping = false
  @observable
  touchClickEv = null

  @action
  resetHoveringRowCol() {
    this.hoveringRowCol = { row: null, col: null }
  }

  handleTouchStart = ev => {
    if (ev.target.id !== 'FoamcoreInteractionLayer') {
      return false
    }
    runInAction(() => {
      this.touchSwiping = false
      this.touchClickEv = ev.touches[0]
    })
  }

  handleTouchMove = ev => {
    runInAction(() => {
      this.touchSwiping = true
      this.touchClickEv = null
    })
  }

  onCursorMove = type => ev => {
    if (ev.target.id !== 'FoamcoreInteractionLayer') return false
    // For some reason, a mouse move event is being published after a touch click
    if (this.touchClickEv && type === 'mouse') return
    const { coordinatesForPosition, uiStore } = this.props
    let rect = { left: 0, top: 0 }
    const container = document.querySelector(`.${FOAMCORE_INTERACTION_LAYER}`)
    if (container) {
      // just a guard for jest shallow render
      rect = container.getBoundingClientRect()
    }

    let { clientX, clientY, target } = ev
    // TouchEnd doesn't give you a clientX, have to get it from start event
    if (type === 'touch') {
      if (this.touchSwiping) return
      const { touchClickEv } = this
      clientX = touchClickEv.clientX
      clientY = touchClickEv.clientY
      target = touchClickEv.target
    }

    const { classList } = target
    if (!classList || !_.includes(classList, FOAMCORE_INTERACTION_LAYER)) {
      // only perform calculation if target is the grid itself
      return
    }

    const coords = coordinatesForPosition({
      x: clientX - rect.left,
      y: clientY - rect.top,
    })

    const { cardMatrix } = this.props.collection
    const { row, col } = coords

    ev.preventDefault()
    ev.stopPropagation()
    // If there's a card already there don't render a positioned blank card
    if (cardMatrix[row] && cardMatrix[row][col]) {
      this.resetHoveringRowCol()
    } else {
      this.repositionBlankCard({ row, col })
      if (uiStore.isMobileXs) {
        this.scrollToBlank(clientY)
      }
    }
  }

  onCreateBct = async ({ row, col, hotcell = false }, contentType) => {
    const { selectedAreaMinX } = this
    const { apiStore, uiStore, collection } = this.props

    // If user is selecting an area, don't trigger blank card click
    if (selectedAreaMinX) {
      return
    }

    // BCT is already open as a hotcell, just modify it
    if (uiStore.blankContentToolState.blankType === 'hotcell') {
      runInAction(() => {
        uiStore.blankContentToolState = {
          ...uiStore.blankContentToolState,
          blankType: contentType,
        }
      })
      return
    }

    uiStore.openBlankContentTool({
      row,
      col,
      collectionId: collection.id,
      blankType: hotcell ? 'hotcell' : contentType,
    })
    if (!uiStore.isTouchDevice) {
      runInAction(() => {
        this.resetHoveringRowCol()
        this.touchSwiping = false
        this.touchClickEv = null
      })
    }

    this.resetHoveringRowCol()
    if (hotcell) {
      const placeholder = new CollectionCard(
        {
          row,
          col,
          parent_id: collection.id,
        },
        apiStore
      )
      await placeholder.API_createBct()
      uiStore.setBctPlaceholderCard(placeholder)
    }
  }

  onCloseHtc = () => {
    this.resetHoveringRowCol()
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
    this.resetHoveringRowCol()
  }

  scrollToBlank(clientY) {
    const { relativeZoomLevel } = this.props
    const viewPortH = window.innerHeight
    const mobileMenuH = 200
    if (viewPortH - mobileMenuH < clientY) {
      const scrollAmount = (clientY - mobileMenuH) / relativeZoomLevel
      window.scrollBy({
        top: scrollAmount,
        behavior: 'smooth',
      })
    }
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
    this.hoveringRowCol = { row, col }
  }

  renderBlankCard = (
    { row, col, width, height, emptyRow = false },
    interactionType
  ) => {
    const {
      uiStore,
      collection,
      hasDragCollision,
      relativeZoomLevel,
    } = this.props
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
        onCloseHtc={this.onCloseHtc}
        zoomLevel={relativeZoomLevel}
        data-empty-space-click
      />
    )
  }

  get renderRightBlankActions() {
    const {
      collection,
      collection: { collection_cards, isFourWideBoard },
    } = this.props
    const { row } = this.hoveringRowCol
    if (!_.isNumber(row)) return null
    const emptyRow =
      !_.some(collection_cards, { row }) &&
      !_.some(collection_cards, { row: row - 1, height: 2 })

    if (!emptyRow) return null
    if (!isFourWideBoard) return null

    let card
    if (collection.cardMatrix[row]) {
      card = collection.cardMatrix[row][0]
    }

    return (
      <RowActions
        row={row}
        height={card ? card.height : 1}
        onInsertRow={this.handleInsertRowClick}
        onRemoveRow={this.handleRemoveRowClick}
      />
    )
  }

  get renderDragSpots() {
    const { hoveringOverCollection, uiStore } = this.props
    const { dragGridSpot, movingCardsOverflow } = uiStore

    if (!dragGridSpot.size || hoveringOverCollection) {
      return null
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
    const blankCards = []
    const { uiStore } = this.props
    const { droppingFilesCount } = uiStore

    const takenSpots = []

    const positions = []

    for (let i = 0; i < droppingFilesCount; i++) {
      const openSpot = this.calculateOpenSpot(takenSpots)

      if (openSpot) {
        const position = {
          row: openSpot.row,
          col: openSpot.col,
          width: 1,
          height: 1,
        }
        positions.push(position)
        blankCards.push(this.positionBlank(position, 'hover'))
        takenSpots.push(position)
      }
    }

    return blankCards
  }

  calculateOpenSpot = takenSpots => {
    const { collection, uiStore } = this.props
    const { row, col } = this.hoveringRowCol

    if (!row && !col) return null

    // NOTE: Collection::cardMatrix only returns cards until the collection cards max row
    const openSpotMatrix = calculateOpenSpotMatrix({
      collection,
      takenSpots,
      maxVisibleRow: uiStore.visibleRows && Math.floor(uiStore.visibleRows.max),
    })

    const closestOpenSpot = findClosestOpenSpot(
      {
        row,
        col,
        width: 1,
        height: 1,
      },
      openSpotMatrix,
      collection.num_columns
    )

    return closestOpenSpot
  }

  get renderInnerDragLayer() {
    const { uiStore, dragging, resizing } = this.props

    const { droppingFilesCount } = uiStore

    if (dragging && !resizing && droppingFilesCount === 0) {
      return this.renderDragSpots
    } else if (resizing && droppingFilesCount === 0) {
      return this.renderResizeSpot
    } else if (droppingFilesCount > 0) {
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
                this.onCreateBct({ col, row, hotcell: true })
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
      const interactionType =
        blankContentToolState.blankType === 'hotcell' ? 'hotcell' : 'bct'
      return this.positionBlank({ ...blankContentToolState }, interactionType)
    }

    return null
  }

  render() {
    const { uiStore } = this.props

    return (
      <DragLayerWrapper
        id="FoamcoreInteractionLayer"
        data-empty-space-click
        className={FOAMCORE_INTERACTION_LAYER}
        onMouseMove={this.onCursorMove('mouse')}
        onTouchStart={this.handleTouchStart}
        onTouchMove={this.handleTouchMove}
        onTouchEnd={this.onCursorMove('touch')}
        onDragOver={e => {
          e.preventDefault()
          this.onCursorMove('mouse')(e)
          const numItems = _.get(e, 'dataTransfer.items.length', 0)
          uiStore.setDroppingFilesCount(numItems)
        }}
        onDragLeave={e => {
          e.preventDefault()
          if (
            !!(
              e.target.getAttribute &&
              e.target.getAttribute('data-empty-space-click')
            ) ||
            e.target.closest('.gridCardDropzone')
          ) {
            return
          }
          uiStore.setDroppingFilesCount(0)
        }}
        onMouseLeave={e => {
          e.preventDefault()
          this.resetHoveringRowCol()
          uiStore.setDroppingFilesCount(0)
        }}
      >
        {this.renderInnerDragLayer}
        {this.renderHotEdges}
        {this.renderBct}
        {this.renderRightBlankActions}
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
