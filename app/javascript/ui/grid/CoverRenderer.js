import _ from 'lodash'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import { routingStore, uiStore } from '~/stores'
import PlainLink from '~/ui/global/PlainLink'
import LinkItemCover from '~/ui/grid/covers/LinkItemCover'
import TextItemCover from '~/ui/grid/covers/TextItemCover'
import PdfFileItemCover from '~/ui/grid/covers/PdfFileItemCover'
import ImageItemCover from '~/ui/grid/covers/ImageItemCover'
import VideoItemCover from '~/ui/grid/covers/VideoItemCover'
import GenericFileItemCover from '~/ui/grid/covers/GenericFileItemCover'
import CollectionCover from '~/ui/grid/covers/CollectionCover'
import DataItemCover from '~/ui/grid/covers/DataItemCover'
import LegendItemCover from '~/ui/grid/covers/LegendItemCover'

import { ITEM_TYPES } from '~/utils/variables'

class CoverRenderer extends React.Component {
  get isItem() {
    return this.props.cardType === 'items'
  }

  get isCollection() {
    return this.props.cardType === 'collections'
  }

  get renderCover() {
    const {
      card,
      dragging,
      record,
      height,
      handleClick,
      searchResult,
      isBoardCollection,
      isTestCollectionCard,
      nestedTextItem,
      textItemHideReadMore,
      textItemUneditable,
    } = this.props

    const { viewingCollection } = uiStore

    const isLargeBoard =
      isBoardCollection &&
      viewingCollection &&
      !viewingCollection.isFourWideBoard

    if (card.isSection) {
      // TODO: fill this in...
      return (
        <div
          style={{ height: '100%', padding: '20px', border: '1px solid black' }}
        />
      )
    }
    if (this.isItem) {
      switch (record.type) {
        case ITEM_TYPES.TEXT:
          return (
            <TextItemCover
              item={record}
              height={height}
              dragging={dragging}
              cardId={card.id}
              handleClick={handleClick}
              searchResult={searchResult}
              initialSize={isLargeBoard ? 'huge' : 'normal'}
              hideReadMore={textItemHideReadMore}
              uneditable={textItemUneditable}
            />
          )
        case ITEM_TYPES.EXTERNAL_IMAGE:
          return <ImageItemCover item={record} contain={card.image_contain} />
        case ITEM_TYPES.FILE: {
          if (record.isPdfFile) {
            return <PdfFileItemCover item={record} />
          } else if (record.isImage) {
            return (
              <ImageItemCover
                item={record}
                contain={card.image_contain}
                isTestCollectionCard={isTestCollectionCard}
              />
            )
          } else if (record.isVideo) {
            return <VideoItemCover item={record} dragging={dragging} />
          } else if (record.filestack_file) {
            return <GenericFileItemCover item={record} />
          }
          return <div style={{ padding: '20px' }}>File not found.</div>
        }
        case ITEM_TYPES.VIDEO:
          return <VideoItemCover item={record} dragging={dragging} />
        case ITEM_TYPES.LINK:
          return (
            <LinkItemCover
              item={record}
              fontColor={card.font_color}
              cardHeight={card.height}
              dragging={dragging}
            />
          )
        case ITEM_TYPES.DATA:
          // We must pass in dataset ids to trigger
          // re-render when new datasets are added
          return (
            <DataItemCover
              datasetIds={record.datasets ? _.map(record.datasets, 'id') : []}
              height={height}
              item={record}
              card={card}
            />
          )

        case ITEM_TYPES.LEGEND:
          return <LegendItemCover item={record} card={card} />

        default:
          return <div>{record.content}</div>
      }
    } else if (this.isCollection) {
      return (
        <CollectionCover
          cardId={card.id}
          width={card.maxWidth}
          height={card.maxHeight}
          fontColor={card.font_color}
          collection={record}
          subtitle={record.subtitle}
          dragging={dragging}
          searchResult={searchResult}
          inSubmissionsCollection={
            card.parentCollection &&
            card.parentCollection.isSubmissionsCollection
          }
          textItem={nestedTextItem}
          card={card}
        />
      )
    }
    return <div />
  }

  handleClickToCollection = e => {
    const { record } = this.props
    if (record.can_view) return true

    e.stopPropagation()
    e.preventDefault()
    uiStore.showPermissionsAlert()
    return false
  }

  render() {
    const {
      isCoverItem,
      card: { record },
    } = this.props
    if (isCoverItem && !record.isCreativeDifferenceChartCover) {
      return (
        <PlainLink
          onClick={this.handleClickToCollection}
          onKeyDown={this.handleClickToCollection}
          to={routingStore.pathTo('collections', record.id)}
          role="link"
          tabIndex="0"
        >
          {this.renderCover}
        </PlainLink>
      )
    }
    return this.renderCover
  }
}

CoverRenderer.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  cardType: PropTypes.string.isRequired,
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  isBoardCollection: PropTypes.bool,
  isTestCollectionCard: PropTypes.bool,
  isCoverItem: PropTypes.bool,
  height: PropTypes.number,
  dragging: PropTypes.bool,
  searchResult: PropTypes.bool,
  handleClick: PropTypes.func,
  nestedTextItem: MobxPropTypes.objectOrObservableObject,
  textItemHideReadMore: PropTypes.bool,
  textItemUneditable: PropTypes.bool,
}

CoverRenderer.defaultProps = {
  height: 1,
  dragging: false,
  searchResult: false,
  isCoverItem: false,
  isBoardCollection: false,
  isTestCollectionCard: false,
  handleClick: () => null,
  nestedTextItem: null,
  textItemHideReadMore: false,
  textItemUneditable: false,
}

export default CoverRenderer
