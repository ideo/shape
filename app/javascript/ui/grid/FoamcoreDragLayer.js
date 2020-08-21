import _ from 'lodash'
import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

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
    this.throttledSetHoveringRowCol = _.throttle(this.setHoveringRowCol, 150)
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
    this.throttledSetHoveringRowCol({ row, col })
    return { row, col }
  }

  @action
  setHoveringRowCol = ({ row, col }) => {
    const prevRow = this.hoveringRowCol.row
    const prevCol = this.hoveringRowCol.col
    if (row === prevRow && col === prevCol) {
      return
    }
    this.hoveringRowCol = { row, col }
  }

  get renderDragSpots() {
    const { hoveringOverCollection, positionBlank, uiStore } = this.props
    const { dragGridSpot, movingCardsOverflow } = uiStore

    if (!dragGridSpot.size || hoveringOverCollection) {
      return
    }

    const draggingPlaceholders = [...dragGridSpot.values()]

    console.log(draggingPlaceholders)

    const maxRowCard = _.maxBy(draggingPlaceholders, 'row')
    const maxRow = maxRowCard && maxRowCard.row
    return _.map(draggingPlaceholders, placeholder => {
      placeholder.id = 'drag'
      const atMaxRow =
        placeholder.row === maxRow ||
        placeholder.row + placeholder.height - 1 === maxRow
      if (movingCardsOverflow && atMaxRow) {
        placeholder.id = 'drag-overflow'
      }
      return positionBlank(placeholder, placeholder.id)
    })
  }

  get renderBlanks() {
    const { positionBlank, dragging } = this.props
    const { row, col } = this.hoveringRowCol
    if (dragging) {
      return
    }

    if (row !== null && col !== null) {
      return positionBlank(
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

  render() {
    const { uiStore, setDroppingFiles } = this.props

    return (
      <DragLayerWrapper
        data-empty-space-click
        className={FOAMCORE_DRAG_LAYER}
        onMouseMove={!uiStore.isTouchDevice ? this.onCursorMove : null}
        onTouchStart={uiStore.isTouchDevice ? this.onCursorMove : null}
        onDragOver={e => {
          e.preventDefault()
          this.onCursorMove(e)
          setDroppingFiles(isFile(e.dataTransfer))
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
          setDroppingFiles(false)
        }}
      >
        {this.renderDragSpots}
        {this.renderBlanks}
      </DragLayerWrapper>
    )
  }
}

FoamcoreDragLayer.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  coordinatesForPosition: PropTypes.func.isRequired,
  setDroppingFiles: PropTypes.func.isRequired,
  positionBlank: PropTypes.func.isRequired,
  hoveringOverCollection: PropTypes.bool.isRequired,
  dragging: PropTypes.bool.isRequired,
}

FoamcoreDragLayer.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default FoamcoreDragLayer
