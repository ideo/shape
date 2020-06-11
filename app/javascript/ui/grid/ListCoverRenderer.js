import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import { routingStore, uiStore } from '~/stores'
import FilestackUpload from '~/utils/FilestackUpload'
import PlainLink from '~/ui/global/PlainLink'
import LinkItemCover from '~/ui/grid/covers/LinkItemCover'
import PdfFileItemCover from '~/ui/grid/covers/PdfFileItemCover'
import ImageItemCover from '~/ui/grid/covers/ImageItemCover'
import VideoItemCover from '~/ui/grid/covers/VideoItemCover'
import GenericFileItemCover from '~/ui/grid/covers/GenericFileItemCover'
import { StyledCollectionCover } from '~/ui/grid/covers/CollectionCover'
import LegendItemCover from '~/ui/grid/covers/LegendItemCover'

import v, { ITEM_TYPES } from '~/utils/variables'

class ListCoverRenderer extends React.Component {
  get isItem() {
    return this.props.cardType === 'items'
  }

  get isCollection() {
    return this.props.cardType === 'collections'
  }

  get renderCover() {
    const { card, dragging, record } = this.props

    if (this.isItem) {
      switch (record.type) {
        case ITEM_TYPES.TEXT:
          return (
            <StyledCollectionCover backgroundColor={v.colors.commonDark}>
              <div style={{ padding: '16px 20px' }}></div>
            </StyledCollectionCover>
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
          return <VideoItemCover item={record} dragging={dragging} unPlayable />
        case ITEM_TYPES.LINK:
          return (
            <LinkItemCover
              item={record}
              cardHeight={card.height}
              dragging={dragging}
              listStyle
            />
          )
        case ITEM_TYPES.DATA:
          // We must pass in dataset length to trigger
          // re-render when new datasets are added
          return (
            <StyledCollectionCover
              backgroundColor={v.colors.commonDark}
            ></StyledCollectionCover>
          )

        case ITEM_TYPES.LEGEND:
          return <LegendItemCover item={record} card={card} />

        default:
          return <div>{record.content}</div>
      }
    } else if (this.isCollection) {
      const {
        card: { record },
      } = this.props
      const { cover } = record
      let url = cover.image_url
      if (cover.image_handle) {
        url = FilestackUpload.imageUrl({
          handle: cover.image_handle,
        })
      }
      return (
        <StyledCollectionCover
          url={url}
          backgroundColor={v.colors.commonDark}
        ></StyledCollectionCover>
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
    return (
      <div style={{ width: '60px', height: '50px', marginRight: '12px' }}>
        {isCoverItem && !record.isCreativeDifferenceChartCover ? (
          <PlainLink
            onClick={this.handleClickToCollection}
            onKeyDown={this.handleClickToCollection}
            to={routingStore.pathTo('collections', record.id)}
            role="link"
            tabIndex="0"
          >
            {this.renderCover}
          </PlainLink>
        ) : (
          this.renderCover
        )}
      </div>
    )
  }
}

ListCoverRenderer.propTypes = {
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

ListCoverRenderer.defaultProps = {
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

export default ListCoverRenderer
