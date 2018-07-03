import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'
import styled from 'styled-components'

import GridCardHotspot from '~/ui/grid/GridCardHotspot'
import TextItemCover from '~/ui/grid/covers/TextItemCover'
import ImageItemCover from '~/ui/grid/covers/ImageItemCover'
import VideoItemCover from '~/ui/grid/covers/VideoItemCover'
import CollectionCover from '~/ui/grid/covers/CollectionCover'

import CardMenu from '~/ui/grid/CardMenu'
import CollectionIcon from '~/ui/icons/CollectionIcon'
import LinkIcon from '~/ui/icons/LinkIcon'
import LinkedCollectionIcon from '~/ui/icons/LinkedCollectionIcon'
import RequiredCollectionIcon from '~/ui/icons/RequiredCollectionIcon'
import PinnedIcon from '~/ui/icons/PinnedIcon'
import SelectionCircle from '~/ui/grid/SelectionCircle'
import Tooltip from '~/ui/global/Tooltip'
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
`
StyledGridCard.displayName = 'StyledGridCard'

export const StyledBottomLeftIcon = styled.div`
  position: absolute;
  z-index: ${v.zIndex.gridCard};
  left: 0.25rem;
  bottom: 0;
  color: ${v.colors.gray};
  width: 45px;
  height: 45px;
  /* LinkIcon appears larger than CollectionIcon so we need to make it smaller */
  ${props => props.small && `
    width: 18px;
    height: 18px;
    bottom: 0.75rem;
    left: 0.75rem;
  `}
`
StyledBottomLeftIcon.displayName = 'StyledBottomLeftIcon'

const StyledGridCardInner = styled.div`
  position: relative;
  height: 100%;
  overflow: hidden;
  z-index: 1;
  /*
  // related to userSelectHack from Rnd / Draggable
  // disable blue text selection on Draggables
  // https://github.com/bokuweb/react-rnd/issues/199
  */
  *::-moz-selection {background: transparent;}
  *::selection {background: transparent;}
`
StyledGridCardInner.displayName = 'StyledGridCardInner'

export const StyledTopRightActions = styled.div`
  position: absolute;
  top: 0.35rem;
  right: 0.25rem;
  z-index: ${v.zIndex.gridCardTop};
  .card-menu {
    margin-top: 0.25rem;
    display: inline-block;
    vertical-align: top;
    z-index: ${v.zIndex.gridCardTop};
    color: ${v.colors.gray};
  }
`
StyledTopRightActions.displayName = 'StyledTopRightActions'

class GridCard extends React.Component {
  get canEditCard() {
    const { isSharedCollection, canEditCollection, card, record } = this.props
    if (isSharedCollection) return false
    // you can always edit your link cards, regardless of record.can_edit
    if (canEditCollection && card.link) return true
    return record.can_edit
  }

  get canReplace() {
    const { record } = this.props
    return (this.isItem && _.includes([ITEM_TYPES.IMAGE, ITEM_TYPES.VIDEO], record.type))
  }

  get isItem() {
    return this.props.cardType === 'items'
  }

  get isCollection() {
    return this.props.cardType === 'collections'
  }

  get isSelectable() {
    return (this.props.isSharedCollection || this.canEditCard)
  }

  get renderInner() {
    const { card, record, height } = this.props
    if (this.isItem) {
      switch (record.type) {
      case ITEM_TYPES.TEXT:
        return <TextItemCover item={record} height={height} />
      case ITEM_TYPES.IMAGE:
        return <ImageItemCover item={record} />
      case ITEM_TYPES.VIDEO:
        return <VideoItemCover item={record} dragging={this.props.dragging} />
      default:
        return (
          <div>
            [{card.order}] &nbsp;
            {record.content}
          </div>
        )
      }
    } else if (this.isCollection) {
      return (
        <CollectionCover
          width={card.maxWidth}
          height={card.maxHeight}
          collection={record}
        />
      )
    }
    return <div />
  }

  get renderIcon() {
    const { card, cardType } = this.props
    let icon
    let small = false
    if (cardType === 'collections') {
      if (card.link) {
        icon = <LinkedCollectionIcon />
      } else if (card.record.isRequired) {
        icon = (
          <Tooltip
            classes={{ tooltip: 'Tooltip' }}
            title={'required template'}
            placement="top"
          >
            <RequiredCollectionIcon />
          </Tooltip>
        )
      } else {
        icon = <CollectionIcon />
      }
    } else if (card.link) {
      small = true
      icon = <LinkIcon />
    } else if (card.isPinned) {
      icon = <PinnedIcon />
    }

    if (!icon) return ''

    return (
      <StyledBottomLeftIcon small={small}>
        {icon}
      </StyledBottomLeftIcon>
    )
  }

  handleClick = (e) => {
    if (this.props.dragging) return
    this.props.handleClick(e)
  }

  render() {
    const {
      card,
      record,
      canEditCollection,
      dragging,
      menuOpen,
      lastPinnedCard
    } = this.props

    const firstCardInRow = card.position && card.position.x === 0

    return (
      <StyledGridCard dragging={dragging}>
        {canEditCollection || (!card.isPinned || lastPinnedCard) &&
          <GridCardHotspot card={card} dragging={dragging} />
        }
        {(canEditCollection && firstCardInRow) || !card.isPinned &&
          <GridCardHotspot card={card} dragging={dragging} position="left" />
        }
        {(!record.isSharedCollection && !record.isOrgTemplateCollection) &&
          <StyledTopRightActions>
            {this.isSelectable &&
              <SelectionCircle cardId={card.id} />
            }
            <CardMenu
              className="show-on-hover card-menu"
              card={card}
              canEdit={this.canEditCard}
              canReplace={this.canReplace}
              menuOpen={menuOpen}
            />
          </StyledTopRightActions>
        }
        {this.renderIcon}
        {/* onClick placed here so it's separate from hotspot click */}
        <StyledGridCardInner onClick={this.handleClick}>
          {this.renderInner}
        </StyledGridCardInner>
      </StyledGridCard>
    )
  }
}

GridCard.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  canEditCollection: PropTypes.bool.isRequired,
  isSharedCollection: PropTypes.bool.isRequired,
  cardType: PropTypes.string.isRequired,
  height: PropTypes.number.isRequired,
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  dragging: PropTypes.bool.isRequired,
  handleClick: PropTypes.func.isRequired,
  menuOpen: PropTypes.bool.isRequired,
  lastPinnedCard: PropTypes.bool,
}

GridCard.defaultProps = {
  lastPinnedCard: false,
}

export default GridCard
