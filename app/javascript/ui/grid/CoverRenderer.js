import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import { routingStore } from '~/stores'
import LinkItemCover from '~/ui/grid/covers/LinkItemCover'
import TextItemCover from '~/ui/grid/covers/TextItemCover'
import PdfFileItemCover from '~/ui/grid/covers/PdfFileItemCover'
import ImageItemCover from '~/ui/grid/covers/ImageItemCover'
import VideoItemCover from '~/ui/grid/covers/VideoItemCover'
import GenericFileItemCover from '~/ui/grid/covers/GenericFileItemCover'
import CollectionCover from '~/ui/grid/covers/CollectionCover'
import DataItemCover from '~/ui/grid/covers/DataItemCover'
import ChartItemCover from '~/ui/grid/covers/ChartItemCover'
import LegendItemCover from '~/ui/grid/covers/LegendItemCover'

import { ITEM_TYPES } from '~/utils/variables'

class CoverRenderer extends React.PureComponent {
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
    } = this.props
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
            />
          )
        case ITEM_TYPES.EXTERNAL_IMAGE:
          return <ImageItemCover item={record} contain={card.image_contain} />
        case ITEM_TYPES.FILE: {
          if (record.isPdfFile) {
            return <PdfFileItemCover item={record} />
          } else if (record.isImage) {
            return <ImageItemCover item={record} contain={card.image_contain} />
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
              cardHeight={card.height}
              dragging={dragging}
            />
          )
        case ITEM_TYPES.CHART:
          return <ChartItemCover item={record} testCollection={card.parent} />

        case ITEM_TYPES.DATA:
          return <DataItemCover height={height} item={record} card={card} />

        case ITEM_TYPES.LEGEND:
          return <LegendItemCover item={record} card={card} />

        default:
          return <div>{record.content}</div>
      }
    } else if (this.isCollection) {
      return (
        <CollectionCover
          width={card.maxWidth}
          height={card.maxHeight}
          collection={record}
          dragging={dragging}
          inSubmissionsCollection={
            card.parentCollection &&
            card.parentCollection.isSubmissionsCollection
          }
        />
      )
    }
    return <div />
  }

  handleClickToCollection = () => {
    const { card } = this.props
    routingStore.routeTo('collections', card.record.id)
  }

  render() {
    const { coverItem } = this.props
    if (coverItem) {
      return (
        <div
          onClick={this.handleClickToCollection}
          onKeyDown={this.handleClickToCollection}
          role="link"
          tabIndex="0"
        >
          {this.renderCover}
        </div>
      )
    }
    return this.renderCover
  }
}

CoverRenderer.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  cardType: PropTypes.string.isRequired,
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  coverItem: PropTypes.bool,
  height: PropTypes.number,
  dragging: PropTypes.bool,
  searchResult: PropTypes.bool,
  handleClick: PropTypes.func,
}

CoverRenderer.defaultProps = {
  height: 1,
  dragging: false,
  searchResult: false,
  coverItem: false,
  handleClick: () => null,
}

export default CoverRenderer
