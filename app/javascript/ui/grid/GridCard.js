import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import ContainImage from '~/ui/grid/ContainImage'
import GridCardHotspot from '~/ui/grid/GridCardHotspot'
import LinkItemCover from '~/ui/grid/covers/LinkItemCover'
import TextItemCover from '~/ui/grid/covers/TextItemCover'
import PdfFileItemCover from '~/ui/grid/covers/PdfFileItemCover'
import ImageItemCover from '~/ui/grid/covers/ImageItemCover'
import VideoItemCover from '~/ui/grid/covers/VideoItemCover'
import GenericFileItemCover from '~/ui/grid/covers/GenericFileItemCover'
import CollectionCover from '~/ui/grid/covers/CollectionCover'

import ActionMenu from '~/ui/grid/ActionMenu'
import CollectionIcon from '~/ui/icons/CollectionIcon'
import LinkIcon from '~/ui/icons/LinkIcon'
import Download from '~/ui/grid/Download'
import FilestackUpload from '~/utils/FilestackUpload'
import LinkedCollectionIcon from '~/ui/icons/LinkedCollectionIcon'
import RequiredCollectionIcon from '~/ui/icons/RequiredCollectionIcon'
import PinnedIcon from '~/ui/icons/PinnedIcon'
import SelectionCircle from '~/ui/grid/SelectionCircle'
import TagEditorModal from '~/ui/pages/shared/TagEditorModal'
import Tooltip from '~/ui/global/Tooltip'
import { uiStore } from '~/stores'
import v, { ITEM_TYPES } from '~/utils/variables'
import {
  StyledGridCard,
  StyledBottomLeftIcon,
  StyledGridCardInner,
  StyledTopRightActions,
} from './shared'

const PinIconHolder = styled.div`
  background-color: ${props => (props.locked ? 'transparent' : v.colors.blackLava)};
  border-radius: 50%;
  height: 24px;
  margin-left: 10px;
  margin-top: 10px;
  text-align: center;
  width: 24px;

  .icon {
    height: 25px;
    width: 25px;

    svg {
      margin-right: 1px;
      width: 80%;
    }
  }
`

@observer
class GridCard extends React.Component {
  get canEditCard() {
    const { isSharedCollection, canEditCollection, card, record } = this.props
    if (isSharedCollection) return false
    // you can always edit your link cards, regardless of record.can_edit
    if (canEditCollection && card.link) return true
    return record.can_edit
  }

  get isItem() {
    return this.props.cardType === 'items'
  }

  get isCollection() {
    return this.props.cardType === 'collections'
  }

  get renderInner() {
    const { card, record, height } = this.props
    if (this.isItem) {
      switch (record.type) {
      case ITEM_TYPES.TEXT:
        return <TextItemCover item={record} height={height} />
      case ITEM_TYPES.FILE: {
        if (record.filestack_file.mimetype === 'application/pdf') {
          return <PdfFileItemCover item={record} />
        }
        if (record.mimeBaseType === 'image') {
          return <ImageItemCover item={record} contain={card.image_contain} />
        }
        return <GenericFileItemCover item={record} />
      }
      case ITEM_TYPES.VIDEO:
        return <VideoItemCover item={record} dragging={this.props.dragging} />
      case ITEM_TYPES.LINK:
        return <LinkItemCover item={record} dragging={this.props.dragging} />
      default:
        return (
          <div>
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
          dragging={this.props.dragging}
        />
      )
    }
    return <div />
  }

  get actionsColor() {
    const { record } = this.props
    if (this.isItem) {
      if (record.isGenericFile) {
        return v.colors.blackLava
      }
      return v.colors.gray
    }
    return v.colors.gray
  }

  get renderIcon() {
    const { card, record, cardType } = this.props
    let icon
    let small = false
    let iconAmount = 1
    if (cardType === 'collections') {
      if (card.link) {
        icon = <LinkedCollectionIcon />
      } else if (record.isRequired) {
        const type = record.isMasterTemplate ? 'template' : 'collection'
        icon = (
          <Tooltip
            title={`required ${type}`}
            placement="top"
          >
            <div>
              <RequiredCollectionIcon />
            </div>
          </Tooltip>
        )
      } else {
        icon = <CollectionIcon />
      }

      if (card.isPinned) {
        icon = (<Fragment>
          { !card.isPinnedAndLocked && this.renderPin() }
          {icon}
          { card.isPinnedAndLocked && this.renderPin() }
        </Fragment>)
        iconAmount = 2
      }
    } else if (card.link) {
      small = true
      icon = <LinkIcon />
    } else if (card.isPinned) {
      icon = this.renderPin()
    }

    if (!icon) return ''

    return (
      // needs to handle the same click otherwise clicking the icon does nothing
      <StyledBottomLeftIcon small={small} onClick={this.handleClick} iconAmount={iconAmount}>
        {icon}
      </StyledBottomLeftIcon>
    )
  }

  renderPin() {
    const { card } = this.props
    const hoverClass = card.isPinnedAndLocked && 'show-on-hover'
    return (
      <Tooltip
        title="pinned"
        placement="top"
      >
        <PinIconHolder className={hoverClass} locked={card.isPinnedAndLocked}>
          <PinnedIcon />
        </PinIconHolder>
      </Tooltip>
    )
  }

  openMenu = () => {
    const { card } = this.props
    if (this.props.menuOpen) {
      uiStore.update('openCardMenuId', false)
    } else {
      uiStore.update('openCardMenuId', card.id)
    }
  }

  closeMenu = () => {
    if (this.props.menuOpen) {
      uiStore.update('openCardMenuId', false)
    }
  }

  linkOffsite = (url) => {
    Object.assign(
      document.createElement('a'), { target: '_blank', href: url }
    ).click()
  }

  handleClick = (e) => {
    const { dragging, record } = this.props
    if (dragging) return
    if (record.type === ITEM_TYPES.LINK) {
      this.linkOffsite(record.url)
      return
    }
    if (record.isPdfFile) {
      FilestackUpload.preview(record.filestack_file.handle, 'filePreview')
      return
    } else if (record.mimeBaseType === 'image') {
      this.props.handleClick(e)
      return
    } else if (record.isGenericFile) {
      // TODO: will replace with preview
      this.linkOffsite(record.filestack_file.url)
      return
    }
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
    const tagEditorOpen = uiStore.tagsModalOpenId === card.id

    return (
      <StyledGridCard dragging={dragging}>
        {(canEditCollection && (!card.isPinnedAndLocked || lastPinnedCard)) &&
          <GridCardHotspot card={card} dragging={dragging} />
        }
        {(canEditCollection && firstCardInRow && !card.isPinnedAndLocked) &&
          <GridCardHotspot card={card} dragging={dragging} position="left" />
        }
        {(
          !record.menuDisabled &&
          uiStore.textEditingItem !== record
        ) &&
          <StyledTopRightActions color={this.actionsColor}>
            { record.isDownloadable && (
              <Download record={record} />
            )}
            { record.isImage && (
              <ContainImage card={card} />
            )}
            <SelectionCircle cardId={card.id} />
            <ActionMenu
              location="GridCard"
              className="show-on-hover card-menu"
              card={card}
              canEdit={this.canEditCard}
              canReplace={record.canReplace}
              menuOpen={menuOpen}
              onOpen={this.openMenu}
              onLeave={this.closeMenu}
            />
          </StyledTopRightActions>
        }
        {this.renderIcon}
        {/* onClick placed here so it's separate from hotspot click */}
        <StyledGridCardInner onClick={this.handleClick}>
          {this.renderInner}
        </StyledGridCardInner>
        <TagEditorModal canEdit={this.canEditCard} record={record} open={tagEditorOpen} />
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
