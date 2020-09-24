import PropTypes from 'prop-types'
import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import localStorage from 'mobx-localstorage'
import styled from 'styled-components'

import CloseIcon from '~/ui/icons/CloseIcon'
import CornerPositioned from '~/ui/global/CornerPositioned'
import HotCellQuadrant, { Quadrant } from './HotCellQuadrant'
import v from '~/utils/variables'

const SLIDE_MS = 200

const Container = styled.div`
  height: 100%;
  position: relative;
  width: 100%;

  ${props =>
    props.isMobileXs &&
    `
    bottom: 0;
    height: 209px;
    left: 0;
    position: fixed;
    transform: translateY(${props.animated ? 0 : 209}px);
    transition: transform ${SLIDE_MS}ms ease-in;
    width: 100%;

    ${Quadrant} {
      border-left: none !important;
      border-top: none !important;
      height: calc(50% - 1px) !important;
      width: calc(33.33%) !important;
    }
  `}

  ${props =>
    props.smallCardWidth &&
    !props.isMobileXs &&
    `
    ${Quadrant} {
      height: 100% !important;
      width: 100% !important;
    }
`}

  ${Quadrant}:nth-child(even) {
    border-left: 1px solid ${v.colors.commonLight};
    width: calc(50% + 1px);
  }

  ${Quadrant}:nth-child(3),
  ${Quadrant}:nth-child(4) {
    border-top: 1px solid ${v.colors.commonLight};
    height: calc(50% + 1px);
  }
`
const CloseButton = styled.button`
  color: ${v.colors.secondaryMedium};
  cursor: pointer;
  display: block;
  right: 14px;
  position: absolute;
  top: 12px;
  width: 12px;
  z-index: ${v.zIndex.gridCardTop};
`

const HOT_CELL_DEFAULT_EITHER_TYPE = 'HotCellDefaultEitherType'
const HOT_CELL_DEFAULT_ITEM_TYPE = 'HotCellDefaultItemType'
const HOT_CELL_DEFAULT_COLLECTION_TYPE = 'HotCellDefaultCollectionType'

@inject('uiStore')
@observer
class HotCell extends React.Component {
  @observable
  animated = false

  componentDidMount() {
    setTimeout(() => runInAction(() => (this.animated = true)), SLIDE_MS)
  }

  handleTypeClick = type => () => {
    this.startCreating(type)
  }

  handleClose = ev => {
    const { onCloseHtc } = this.props
    runInAction(() => (this.animated = false))
    setTimeout(() => {
      onCloseHtc()
    }, SLIDE_MS)
  }

  onCreateContent = type => {
    const { onCreateContent } = this.props
    const collectionType = this.collectionTypes.find(
      collectionType => collectionType.name === type
    )
    const itemType = this.itemTypes.find(itemType => itemType.name === type)
    onCreateContent(type)
    runInAction(() => {
      if (collectionType) {
        localStorage.setItem(HOT_CELL_DEFAULT_COLLECTION_TYPE, type)
      } else if (itemType) {
        localStorage.setItem(HOT_CELL_DEFAULT_ITEM_TYPE, type)
      }
      if (this.isSmallCard) {
        localStorage.setItem(HOT_CELL_DEFAULT_EITHER_TYPE, type)
      }
    })
  }

  get isSmallCard() {
    const { uiStore, zoomLevel } = this.props
    const cardWidth = uiStore.gridSettings.gridW / zoomLevel
    return cardWidth < 132
  }

  get collectionTypes() {
    return [
      { name: 'collection', description: 'Create Collection' },
      { name: 'foamcoreBoard', description: 'Create Foamcore Board' },
      { name: 'searchCollection', description: 'Create Search Collection' },
      { name: 'submissionBox', description: 'Create Submission Box' },
      { name: 'testCollection', description: 'Get Feedback' },
    ]
  }

  get itemTypes() {
    return [
      { name: 'file', description: 'Add File' },
      { name: 'link', description: 'Add Link' },
      { name: 'video', description: 'Link Video' },
      { name: 'report', description: 'Create Report' },
    ]
  }

  get templateTypes() {
    return [{ description: 'Create New Template', name: 'template' }]
  }

  get defaultEitherType() {
    const bothType = localStorage.getItem(HOT_CELL_DEFAULT_EITHER_TYPE)
    return [...this.collectionTypes, ...this.itemTypes].find(
      type => type.name === bothType
    )
  }

  get defaultCollectionType() {
    const collectionType = localStorage.getItem(
      HOT_CELL_DEFAULT_COLLECTION_TYPE
    )
    if (collectionType) {
      return this.collectionTypes.find(type => type.name === collectionType)
    }
    return this.collectionTypes[0]
  }

  get defaultItemType() {
    const itemType = localStorage.getItem(HOT_CELL_DEFAULT_ITEM_TYPE)
    if (itemType) {
      return this.itemTypes.find(type => type.name === itemType)
    }
    return this.itemTypes[0]
  }

  get expandedSubTypes() {
    return [
      { name: 'text', description: 'Add Text' },
      {
        description: 'Media',
        isCategory: true,
        subTypes: () => this.itemTypes,
      },
      {
        description: 'Collections',
        isCategory: true,
        subTypes: () => this.collectionTypes,
      },
      {
        description: 'Template',
        isCategory: true,
        subTypes: () => this.templateTypes,
      },
    ]
  }

  get defaultBothType() {
    return (
      this.defaultEitherType ||
      this.defaultCollectionType ||
      this.defaultItemType
    )
  }

  render() {
    const { uiStore, zoomLevel } = this.props
    let primaryTypes = [
      { name: 'text', description: 'Add Text' },
      { ...this.defaultItemType, subTypes: () => this.itemTypes },
      { ...this.defaultCollectionType, subTypes: () => this.collectionTypes },
      {
        name: 'template',
        description: 'Templates',
        subTypes: () => this.templateTypes,
      },
    ]
    if (this.isSmallCard && !uiStore.isMobileXs) {
      primaryTypes = [
        { ...this.defaultBothType, subTypes: () => this.expandedSubTypes },
      ]
    }
    if (uiStore.isMobileXs) {
      primaryTypes = [
        { name: 'text', description: 'Add Text' },
        { name: 'file', description: 'Add File' },
        { name: 'collection', description: 'Create Collection' },
        { name: 'link', description: 'Add Link' },
        { name: 'template', description: 'Create New Template' },
        {
          name: 'more',
          description: 'More',
          subTypes: () => this.expandedSubTypes,
        },
      ]
    }
    const PositionWrapper = uiStore.isMobileXs
      ? CornerPositioned
      : styled.div`
          height: 100%;
        `

    return (
      <PositionWrapper>
        <Container
          animated={this.animated}
          isMobileXs={uiStore.isMobileXs}
          smallCardWidth={this.isSmallCard}
        >
          {uiStore.isMobileXs && (
            <CloseButton onClick={this.handleClose}>
              <CloseIcon />
            </CloseButton>
          )}
          {primaryTypes.map(({ name, description, subTypes }, idx) => (
            <HotCellQuadrant
              name={name}
              key={name + idx}
              description={description}
              subTypes={subTypes}
              onCreateContent={this.onCreateContent}
              zoomLevel={zoomLevel}
              displayName={uiStore.isMobileXs}
            />
          ))}
        </Container>
      </PositionWrapper>
    )
  }
}

HotCell.propTypes = {
  handleInsertRowClick: PropTypes.func.isRequired,
  handleRemoveRowClick: PropTypes.func.isRequired,
  onCreateContent: PropTypes.func.isRequired,
  onCloseHtc: PropTypes.func.isRequired,
  zoomLevel: PropTypes.number.isRequired,
  emptyRow: PropTypes.bool,
  isFourWideBoard: PropTypes.bool,
  rowIdx: PropTypes.number,
}
HotCell.defaultProps = {
  emptyRow: false,
  isFourWideBoard: true,
  rowIdx: 0,
}
HotCell.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

HotCell.displayName = 'HotCell'

export default HotCell
