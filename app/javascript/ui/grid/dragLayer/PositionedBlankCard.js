import _ from 'lodash'
import styled from 'styled-components'
import v from '~/utils/variables'
import PropTypes from 'prop-types'

import hexToRgba from '~/utils/hexToRgba'
import propShapes from '~/utils/propShapes'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import GridCardDropzone from '~/ui/grid/dropzone/GridCardDropzone'
import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'
import GridCardEmptyHotspot from '~/ui/grid/dragLayer/GridCardEmptyHotspot'

const CircleIconHolder = styled.button`
  border: 1px solid ${v.colors.secondaryMedium};
  border-radius: 50%;
  color: ${v.colors.secondaryMedium};
  height: 32px;
  width: 32px;
`

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
      return v.colors.commonLightest
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
    return 1
  }};
  z-index: ${props =>
    _.includes(props.interactionType, 'drag') ? v.zIndex.cardHovering : 0};

  /* FIXME: is this the same CircleIconHolder under GridCardEmptyHotspot? */

  ${CircleIconHolder} {
    display: none;
    height: 32px;
    width: 32px;
  }

  ${CircleIconHolder} + ${CircleIconHolder} {
    margin-top: 8px;
  }

  ${props =>
    props.interactionType !== 'unrendered' &&
    `&:hover {
    background-color: ${v.colors.primaryLight} !important;

    .plus-icon {
      display: block;
    }

    ${CircleIconHolder} {
      display: block;
    }
  }
  `} .plus-icon {
    display: none;
  }
`

@inject('apiStore', 'uiStore')
@observer
class PositionedBlankCard extends React.Component {
  constructor(props) {
    super(props)
  }

  onClickHotspot = ({ row, col, create = false }) => e => {
    const { apiStore, uiStore, collection } = this.props
    const { selectedArea } = uiStore
    const { minX } = selectedArea

    // If user is selecting an area, don't trigger blank card click
    if (minX) {
      return
    }

    // confirmEdit will check if we're in a template and need to confirm changes
    if (collection) {
      collection.confirmEdit({
        onConfirm: () => uiStore.openBlankContentTool({ row, col }),
      })
      return
    }

    uiStore.openBlankContentTool({
      row,
      col,
    })

    // FIXME: when should this be true
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

  render() {
    const { collection, row, col, position, uiStore } = this.props
    const { blankContentToolIsOpen, droppingFiles } = uiStore

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

    if (droppingFiles) {
      return (
        <BlankCardContainer {...defaultProps}>
          <GridCardDropzone />
        </BlankCardContainer>
      )
    } else if (blankContentToolIsOpen) {
      // FIXME: This will be deprecated in the upcoming story
      const blankContentTool = {
        id: 'blank',
        num: 0,
        cardType: 'blank',
        blankType: 'bct',
        col,
        row,
        width,
        height,
      }
      return (
        <BlankCardContainer {...defaultProps}>
          <GridCardBlank
            card={blankContentTool}
            cardType={'blank'}
            position={position}
            record={null}
            parent={collection}
          />
        </BlankCardContainer>
      )
    }

    const { interactionType } = this.props
    const draggingOrResizing = _.includes(['drag', 'resize'], interactionType)

    return (
      <BlankCardContainer
        {...defaultProps}
        interactionType={interactionType}
        onClick={draggingOrResizing ? this.onClickHotspot({ row, col }) : null}
      >
        <GridCardEmptyHotspot interactionType={interactionType} />
      </BlankCardContainer>
    )
  }
}

PositionedBlankCard.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

PositionedBlankCard.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  row: PropTypes.number.isRequired,
  col: PropTypes.number.isRequired,
  position: PropTypes.shape(propShapes.position).isRequired,
  interactionType: PropTypes.oneOf(['hover', 'drag', 'unrendered', 'resize'])
    .isRequired,
  blocked: PropTypes.bool.isRequired,
  // FIXME: clarify what this prop was supposed to do
  // draggedOn: PropTypes.bool.isRequired,
}

export default PositionedBlankCard
