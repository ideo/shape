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
import ResizeIcon from '~/ui/icons/ResizeIcon'
import CardMenu from '~/ui/grid/CardMenu'
import v, { ITEM_TYPES } from '~/utils/variables'

export const StyledGridCard = styled.div`
  z-index: 1;
  position: relative;
  height: 100%;
  width: 100%;
  background: white;
  padding: 0;
  cursor: ${props => (props.dragging ? 'grabbing' : 'pointer')};
  box-shadow: ${props => (props.dragging ? '1px 1px 5px 2px rgba(0, 0, 0, 0.25)' : '')};
  opacity: ${props => (props.dragging ? '0.95' : '1')};
  &:hover {
    z-index: 150;
  }
  > .icon {
    position: absolute;
    left: 1rem;
    bottom: 0.25rem;
    color: ${v.colors.lightBrown};
  }
`
StyledGridCard.displayName = 'StyledGridCard'

const StyledGridCardInner = styled.div`
  position: relative;
  height: 100%;
  overflow: hidden;
  z-index: 1;
`
StyledGridCardInner.displayName = 'StyledGridCardInner'

export const StyledCardActions = styled.div`
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  z-index: 150;
  .card-menu {
    display: inline-block;
    z-index: 150;
  }
`
StyledCardActions.displayName = 'StyledCardActions'

const StyledSelectionCircle = styled.div`
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 14px;
  border: 1px solid ${v.colors.lightBrown};
  margin: 5px;
  &.selected {
    border-color: ${v.colors.teal};
    background-color: ${v.colors.teal};
  }
`
StyledSelectionCircle.displayName = 'StyledSelectionCircle'

const StyledResizeIcon = styled.div`
  position: absolute;
  right: 0.3rem;
  bottom: 0.25rem;
  color: ${v.colors.lightBrown};
  width: 6px;
  height: 6px;
`

class GridCard extends React.Component {
  state = {
    selected: false,
  }

  get isItem() {
    return this.props.cardType === 'items'
  }
  get isCollection() {
    return this.props.cardType === 'collections'
  }

  get inner() {
    const { card, record, height } = this.props
    if (this.isItem) {
      switch (record.type) {
      case ITEM_TYPES.TEXT:
        return <TextItem item={record} height={height} />
      case ITEM_TYPES.IMAGE:
        return <ImageItem item={record} />
      case ITEM_TYPES.VIDEO:
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
    let icon = ''
    if (cardType === 'collections') {
      if (card.reference) {
        icon = <LinkedCollectionIcon />
      } else {
        icon = <CollectionIcon />
      }
    } else if (card.reference) {
      icon = <LinkIcon />
    }
    return icon
  }

  toggleSelected = () => {
    this.setState({
      selected: !this.state.selected
    })
  }

  duplicateCard = () => {
    console.log('Duplicate card')
  }

  linkCard = () => {
    console.log('Link card')
  }

  organizeCard = () => {
    console.log('Organize card')
  }

  archiveCard = () => {
    console.log('Archive card')
  }

  handleClick = () => {
    if (this.props.dragging) return
    this.props.handleClick()
  }

  render() {
    return (
      <StyledGridCard dragging={this.props.dragging}>
        <GridCardHotspot card={this.props.card} dragging={this.props.dragging} />
        <StyledCardActions>
          <StyledSelectionCircle
            className={this.state.selected ? 'selected' : ''}
            onClick={this.toggleSelected}
            role="button"
          />
          <CardMenu
            cardId={this.props.card.id}
            className="card-menu"
            visible={this.state.menuVisible}
            handleDuplicate={this.duplicateCard}
            handleLink={this.linkCard}
            handleOrganize={this.organizeCard}
            handleArchive={this.archiveCard}
          />
        </StyledCardActions>
        {this.icon}
        <StyledResizeIcon>
          <ResizeIcon />
        </StyledResizeIcon>
        {/* onClick placed here so it's separate from hotspot click */}
        <StyledGridCardInner onClick={this.handleClick}>
          {this.inner}
        </StyledGridCardInner>
      </StyledGridCard>
    )
  }
}

GridCard.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  cardType: PropTypes.string.isRequired,
  height: PropTypes.number.isRequired,
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  dragging: PropTypes.bool.isRequired,
  handleClick: PropTypes.func.isRequired,
}

export default GridCard
