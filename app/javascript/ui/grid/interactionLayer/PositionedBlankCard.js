import _ from 'lodash'
import styled from 'styled-components'
import v from '~/utils/variables'
import PropTypes from 'prop-types'

import hexToRgba from '~/utils/hexToRgba'
import propShapes from '~/utils/propShapes'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import GridCardDropzone from '~/ui/grid/dropzone/GridCardDropzone'
import GridCardEmptyHotspot from '~/ui/grid/interactionLayer/GridCardEmptyHotspot'

// When you have attributes that will change a lot,
// it's a performance gain to use `styled.div.attrs`
const BlankCardContainer = styled.div.attrs(({ x, y, h, w, zoomLevel }) => ({
  style: {
    height: `${h}px`,
    left: `${x}px`,
    top: `${y}px`,
    transform: `scale(${1 / zoomLevel})`,
    width: `${w}px`,
    cursor: 'pointer',
  },
}))`
  background: ${props => {
    if (props.interactionType === 'unrendered') {
      return 'none'
    } else if (props.interactionType === 'drag-overflow') {
      const color = props.blocked ? v.colors.alert : v.colors.primaryLight
      return `linear-gradient(
        to bottom,
        ${hexToRgba(color)} 0%,
        ${hexToRgba(color)} 25%,
        ${hexToRgba(color, 0)} 100%)`
    } else if (props.blocked) {
      return v.colors.alert
    } else if (_.includes(['drag', 'resize'], props.interactionType)) {
      return v.colors.primaryLight
    }
    return 'none'
  }};
  position: absolute;
  transform-origin: left top;
  opacity: ${props => {
    if (props.interactionType === 'unrendered') return 0.75
    if (_.includes(props.interactionType, 'drag')) return 0.5
    if (props.interactionType === 'resize') return 0.5
    return 1
  }};
  z-index: ${props =>
    // NOTE: changing this `1` value z-index can break the drag-n-drop upload!
    _.includes(props.interactionType, 'drag') ? v.zIndex.cardHovering : 1};
`

BlankCardContainer.displayName = 'BlankCardContainer'

@inject('uiStore')
@observer
class PositionedBlankCard extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const {
      collection,
      row,
      col,
      position,
      uiStore,
      blocked,
      interactionType,
    } = this.props
    const { droppingFilesCount } = uiStore

    const { xPos, yPos, height, width } = position

    const defaultProps = {
      row,
      col,
      x: xPos,
      y: yPos,
      h: height,
      w: width,
      zoomLevel: uiStore.relativeZoomLevel,
    }

    if (droppingFilesCount > 0) {
      const { fileDropProgress, showDropzoneIcon } = this.props
      return (
        <BlankCardContainer {...defaultProps}>
          <GridCardDropzone
            collection={collection}
            row={row}
            col={col}
            showDropzoneIcon={showDropzoneIcon}
            fileDropProgress={fileDropProgress}
          />
        </BlankCardContainer>
      )
    } else if (
      _.includes(['drag', 'resize', 'drag-overflow'], interactionType)
    ) {
      return (
        <BlankCardContainer
          {...defaultProps}
          blocked={blocked}
          interactionType={interactionType}
        />
      )
    }

    const {
      emptyRow,
      handleBlankCardClick,
      handleInsertRowClick,
      handleRemoveRowClick,
      onCloseHtc,
      zoomLevel,
    } = this.props

    return (
      <BlankCardContainer
        {...defaultProps}
        blocked={blocked}
        interactionType={interactionType}
      >
        <GridCardEmptyHotspot
          interactionType={interactionType}
          parent={collection}
          emptyRow={emptyRow}
          isFourWideBoard={collection.isFourWideBoard}
          onCreateContent={(contentType, opts) => {
            handleBlankCardClick({ row, col }, contentType, opts)
          }}
          handleInsertRowClick={handleInsertRowClick}
          handleRemoveRowClick={handleRemoveRowClick}
          onCloseHtc={onCloseHtc}
          zoomLevel={zoomLevel}
        />
      </BlankCardContainer>
    )
  }
}

PositionedBlankCard.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

PositionedBlankCard.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  row: PropTypes.number.isRequired,
  col: PropTypes.number.isRequired,
  position: PropTypes.shape(propShapes.position).isRequired,
  interactionType: PropTypes.oneOf([
    'hover',
    'drag',
    'unrendered',
    'resize',
    'bct',
    'hotcell',
  ]).isRequired,
  onCloseHtc: PropTypes.func.isRequired,
  handleBlankCardClick: PropTypes.func,
  handleRemoveRowClick: PropTypes.func,
  handleInsertRowClick: PropTypes.func,
  fileDropProgress: PropTypes.number,
  blocked: PropTypes.bool,
  emptyRow: PropTypes.bool,
  replacingId: PropTypes.string,
  showDropzoneIcon: PropTypes.bool,
}

PositionedBlankCard.defaultProps = {
  handleBlankCardClick: null,
  handleRemoveRowClick: null,
  handleInsertRowClick: null,
  fileDropProgress: null,
  blocked: false,
  emptyRow: false,
  replacingId: null,
  showDropzoneIcon: false,
}

PositionedBlankCard.displayName = 'PositionedBlankCard'

export default PositionedBlankCard
