import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import GridCardHotspot from '~/ui/grid/GridCardHotspot'
import TextItem from '~/ui/items/TextItem'
import ImageItem from '~/ui/items/ImageItem'
import VideoItem from '~/ui/items/VideoItem'
import CollectionCover from '~/ui/collections/CollectionCover'
import CollectionIcon from '~/ui/icons/CollectionIcon'
import LinkedCollectionIcon from '~/ui/icons/LinkedCollectionIcon'
import LinkIcon from '~/ui/icons/LinkIcon'
import { ITEM_TYPES } from '~/utils/variables'

export const StyledGridCard = styled.div`
  z-index: 1;
  height: 100%;
  width: 100%;
  background: white;
  padding: 0;
  cursor: ${props => (props.dragging ? 'grabbing' : 'pointer')};
  box-shadow: ${props => (props.dragging ? '1px 1px 5px 2px rgba(0, 0, 0, 0.25)' : '')};
  opacity: ${props => (props.dragging ? '0.95' : '1')};
`
StyledGridCard.displayName = 'StyledGridCard'

const StyledGridCardInner = styled.div`
  position: relative;
  height: 100%;
  overflow: hidden;
  .icon {
    position: absolute;
    left: 1rem;
    bottom: 0.25rem;
  }
`
StyledGridCardInner.displayName = 'StyledGridCardInner'

class GridCard extends React.PureComponent {
  get isItem() {
    return this.props.cardType === 'items'
  }
  get isCollection() {
    return this.props.cardType === 'collections'
  }

  get inner() {
    const { card, record } = this.props
    if (this.isItem) {
      switch (record.type) {
      case ITEM_TYPES.TEXT:
        return <TextItem item={record} />
      case ITEM_TYPES.IMAGE:
        return <ImageItem item={record} />
      case 'Item::VideoItem':
        return <VideoItem item={record} />
      default:
        return (
          <div>
            [{card.order}] &nbsp;
            {record.content}
          </div>
        )
      }
    } else if (this.isCollection) {
      return <CollectionCover collection={record} />
    }
    return <div />
  }

  get icon() {
    const { card, cardType } = this.props
    let icon
    const iconSize = 24
    const color = 'white'
    if (cardType === 'collections') {
      if (card.reference) {
        icon = <LinkedCollectionIcon width={iconSize} height={iconSize} color={color} />
      } else {
        icon = <CollectionIcon width={iconSize} height={iconSize} color={color} />
      }
    } else if (card.reference) {
      icon = <LinkIcon width={iconSize} height={iconSize} color={color} />
    }

    if (icon) {
      return <div className="icon">{icon}</div>
    }
    return ''
  }

  handleClick = () => {
    if (this.props.dragging) return
    this.props.handleClick()
  }

  render() {
    return (
      <StyledGridCard dragging={this.props.dragging}>
        <GridCardHotspot card={this.props.card} dragging={this.props.dragging} />
        {/* onClick placed here so it's separate from hotspot click */}
        <StyledGridCardInner onClick={this.handleClick}>
          {this.inner}
          {this.icon}
        </StyledGridCardInner>
      </StyledGridCard>
    )
  }
}

GridCard.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  cardType: PropTypes.string.isRequired,
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  dragging: PropTypes.bool.isRequired,
  handleClick: PropTypes.func.isRequired,
}

export default GridCard
