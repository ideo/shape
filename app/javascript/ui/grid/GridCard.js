import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import ChartItemCover from '~/ui/grid/covers/ChartItemCover'
import ContainImage from '~/ui/grid/ContainImage'
import CoverImageToggle from '~/ui/grid/CoverImageToggle'
import CoverImageSelector from '~/ui/grid/CoverImageSelector'
import GridCardHotspot from '~/ui/grid/GridCardHotspot'
import LinkItemCover from '~/ui/grid/covers/LinkItemCover'
import TextItemCover from '~/ui/grid/covers/TextItemCover'
import PdfFileItemCover from '~/ui/grid/covers/PdfFileItemCover'
import ImageItemCover from '~/ui/grid/covers/ImageItemCover'
import VideoItemCover from '~/ui/grid/covers/VideoItemCover'
import GenericFileItemCover from '~/ui/grid/covers/GenericFileItemCover'
import CollectionCover from '~/ui/grid/covers/CollectionCover'
import DataItemCover from '~/ui/grid/covers/DataItemCover'

import Activity from '~/stores/jsonApi/Activity'
import ActionMenu from '~/ui/grid/ActionMenu'
import CardActionHolder from '~/ui/icons/CardActionHolder'
import CollectionIcon from '~/ui/icons/CollectionIcon'
import EditButton from '~/ui/reporting/EditButton'
import FullScreenIcon from '~/ui/icons/FullScreenIcon'
import LinkIcon from '~/ui/icons/LinkIcon'
import HiddenIcon from '~/ui/icons/HiddenIcon'
import Download from '~/ui/grid/Download'
import LinkedCollectionIcon from '~/ui/icons/LinkedCollectionIcon'
import RequiredCollectionIcon from '~/ui/icons/RequiredCollectionIcon'
import PinnedIcon from '~/ui/icons/PinnedIcon'
import SelectionCircle from '~/ui/grid/SelectionCircle'
import TagEditorModal from '~/ui/pages/shared/TagEditorModal'
import Tooltip from '~/ui/global/Tooltip'
import { routingStore, uiStore } from '~/stores'
import v, { ITEM_TYPES } from '~/utils/variables'
import {
  StyledGridCard,
  StyledBottomLeftIcon,
  StyledGridCardInner,
  StyledTopRightActions,
} from './shared'

@observer
class GridCard extends React.Component {
  get canEditCard() {
    const {
      isSharedCollection,
      canEditCollection,
      card,
      record,
      searchResult,
    } = this.props
    if (isSharedCollection || searchResult) return false
    // you can always edit your link cards, regardless of record.can_edit
    if (canEditCollection && card.link) return true
    return record.can_edit
  }

  get canContentEditCard() {
    if (this.canEditCard) return true
    const { isSharedCollection, record, searchResult } = this.props
    if (isSharedCollection || searchResult) return false
    return record.can_edit_content
  }

  get isItem() {
    return this.props.cardType === 'items'
  }

  get isCollection() {
    return this.props.cardType === 'collections'
  }

  get isSelected() {
    const { card } = this.props
    return uiStore.isSelected(card.id)
  }

  get renderInner() {
    const { card, record, height, handleClick, searchResult } = this.props
    if (this.isItem) {
      switch (record.type) {
        case ITEM_TYPES.TEXT:
          return (
            <TextItemCover
              item={record}
              height={height}
              dragging={this.props.dragging}
              cardId={card.id}
              handleClick={handleClick}
              searchResult={searchResult}
            />
          )
        case ITEM_TYPES.FILE: {
          if (record.isPdfFile) {
            return <PdfFileItemCover item={record} />
          }
          if (record.isImage) {
            return <ImageItemCover item={record} contain={card.image_contain} />
          }
          if (record.filestack_file) {
            return <GenericFileItemCover item={record} />
          }
          return <div style={{ padding: '20px' }}>File not found.</div>
        }
        case ITEM_TYPES.VIDEO:
          return <VideoItemCover item={record} dragging={this.props.dragging} />
        case ITEM_TYPES.LINK:
          return <LinkItemCover item={record} dragging={this.props.dragging} />

        case ITEM_TYPES.CHART:
          return <ChartItemCover item={record} testCollection={card.parent} />

        case ITEM_TYPES.DATA:
          return <DataItemCover height={height} item={record} card={card} />

        default:
          return <div>{record.content}</div>
      }
    } else if (this.isCollection) {
      return (
        <CollectionCover
          width={card.maxWidth}
          height={card.maxHeight}
          collection={record}
          dragging={this.props.dragging}
          inSubmissionsCollection={
            card.parentCollection &&
            card.parentCollection.isSubmissionsCollection
          }
        />
      )
    }
    return <div />
  }

  get actionsColor() {
    const { record } = this.props
    if (this.isItem) {
      if (record.isGenericFile) {
        return v.colors.black
      }
      return v.colors.commonMedium
    }
    return v.colors.commonMedium
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
          <Tooltip title={`required ${type}`} placement="top">
            <div>
              <RequiredCollectionIcon />
            </div>
          </Tooltip>
        )
      } else {
        icon = <CollectionIcon />
      }

      if (card.isPinned) {
        icon = (
          <Fragment>
            {!card.isPinnedAndLocked && this.renderPin()}
            {icon}
            {card.isPinnedAndLocked && this.renderPin()}
          </Fragment>
        )
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
      <StyledBottomLeftIcon
        small={small}
        onClick={this.handleClick}
        iconAmount={iconAmount}
      >
        {icon}
      </StyledBottomLeftIcon>
    )
  }

  get renderHidden() {
    const { record } = this.props
    if (record.submission_attrs && record.submission_attrs.hidden) {
      return (
        <StyledBottomLeftIcon small iconAmount={1} iconPos={2}>
          <HiddenIcon />
        </StyledBottomLeftIcon>
      )
    }
    return null
  }

  renderPin() {
    const { card } = this.props
    const hoverClass = card.isPinnedAndLocked ? 'show-on-hover' : ''
    return (
      <Tooltip title="pinned" placement="top">
        <PinnedIcon className={hoverClass} locked={card.isPinnedAndLocked} />
      </Tooltip>
    )
  }

  openMenu = () => {
    const { card } = this.props
    if (this.props.menuOpen) {
      uiStore.closeCardMenu()
    } else {
      uiStore.openCardMenu(card.id)
    }
  }

  openContextMenu = ev => {
    const { card } = this.props
    const rect = this.gridCardRef.getBoundingClientRect()
    const x = ev.clientX - rect.left - rect.width * 0.95
    const y = ev.clientY - rect.top - 15

    const direction = ev.screenX < 250 ? 'right' : 'left'
    if (this.props.menuOpen) {
      uiStore.closeCardMenu()
    } else {
      uiStore.openCardMenu(card.id, {
        x,
        y,
        direction,
      })
    }
    ev.preventDefault()
    return false
  }

  closeMenu = () => {
    // this happens when you mouse off the ActionMenu
    if (this.props.menuOpen) {
      // if we right-clicked, keep the menu open
      if (!uiStore.cardMenuOpenAndPositioned) {
        uiStore.closeCardMenu()
      }
    }
  }

  closeContextMenu = () => {
    // this happens any time you mouse off the whole card
    uiStore.closeCardMenu()
  }

  linkOffsite = url => {
    const { record } = this.props
    Activity.trackActivity('viewed', record)
    const anchor = Object.assign(document.createElement('a'), {
      target: '_blank',
      href: url,
    })
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
  }

  // Only data cards are editable right now
  editCard = ev => {
    ev.preventDefault()
    const { card } = this.props
    uiStore.toggleEditingCardId(card.id)
  }

  onCollectionCoverChange = () => {
    const { card } = this.props
    // Reassign the previous cover when a new cover is assigned as the backend will have changed.
    card.parent.reassignCover(card)
  }

  get hasCover() {
    const { record } = this.props
    if (record.internalType === 'collections') {
      return !!record.cover.image_url
    }
    return !!record.thumbnail_url
  }

  handleClick = e => {
    const { card, dragging, record } = this.props
    if (dragging) return
    if (uiStore.captureKeyboardGridClick(e, card.id)) {
      return
    }
    if (record.type === ITEM_TYPES.LINK) {
      this.linkOffsite(record.url)
      return
    }
    if (record.isPdfFile) {
      // TODO: could replace with preview
      Activity.trackActivity('downloaded', record)
      return
    } else if (record.type === ITEM_TYPES.VIDEO || record.isImage) {
      return
    } else if (record.mimeBaseType === 'image') {
      this.props.handleClick(e)
      return
    } else if (record.isGenericFile) {
      // TODO: could replace with preview
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
      lastPinnedCard,
      testCollectionCard,
      searchResult,
    } = this.props

    const firstCardInRow = card.position && card.position.x === 0
    const tagEditorOpen = uiStore.tagsModalOpenId === card.id

    return (
      <StyledGridCard
        className="gridCard"
        id={`gridCard-${card.id}`}
        dragging={dragging}
        testCollectionCard={testCollectionCard}
        // mostly for E2E checking purposes
        data-width={card.width}
        data-height={card.height}
        data-order={card.order}
        data-cy="GridCard"
        onContextMenu={this.openContextMenu}
        innerRef={c => (this.gridCardRef = c)}
        onMouseLeave={this.closeContextMenu}
        selected={this.isSelected}
      >
        {canEditCollection &&
          (!card.isPinnedAndLocked || lastPinnedCard) && (
            <GridCardHotspot card={card} dragging={dragging} />
          )}
        {canEditCollection &&
          firstCardInRow &&
          !card.isPinnedAndLocked && (
            <GridCardHotspot card={card} dragging={dragging} position="left" />
          )}
        {!record.menuDisabled &&
          uiStore.textEditingItem !== record && (
            <StyledTopRightActions
              color={this.actionsColor}
              className="show-on-hover"
            >
              {record.isDownloadable && <Download record={record} />}
              {record.canSetACover && (
                <CoverImageSelector card={card} parentRef={this.gridCardRef} />
              )}
              {record.canBeSetAsCover &&
                canEditCollection && (
                  <CoverImageToggle
                    card={card}
                    onReassign={this.onCollectionCoverChange}
                  />
                )}
              {record.isData && <EditButton onClick={this.editCard} />}
              {record.isImage &&
                this.canContentEditCard && <ContainImage card={card} />}
              {(record.isImage || record.isText) && (
                <CardActionHolder
                  className="show-on-hover"
                  onClick={() => routingStore.routeTo('items', card.record.id)}
                  tooltipText="go to page"
                >
                  <FullScreenIcon />
                </CardActionHolder>
              )}
              {!testCollectionCard && <SelectionCircle cardId={card.id} />}
              <ActionMenu
                location={searchResult ? 'Search' : 'GridCard'}
                className="show-on-hover"
                wrapperClassName="card-menu"
                card={card}
                canEdit={this.canEditCard}
                canReplace={record.canReplace && !card.link && !searchResult}
                menuOpen={menuOpen}
                onOpen={this.openMenu}
                onLeave={this.closeMenu}
                testCollectionCard={testCollectionCard}
              />
            </StyledTopRightActions>
          )}
        {this.renderIcon}
        {this.renderHidden}
        {/* onClick placed here so it's separate from hotspot click */}
        <StyledGridCardInner
          onClick={this.handleClick}
          hasOverflow={record.isData}
          filter={card.filter}
          forceFilter={!this.hasCover}
        >
          {this.renderInner}
        </StyledGridCardInner>
        <TagEditorModal
          canEdit={this.canEditCard}
          record={record}
          open={tagEditorOpen}
        />
      </StyledGridCard>
    )
  }
}

GridCard.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  cardType: PropTypes.string.isRequired,
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  height: PropTypes.number,
  canEditCollection: PropTypes.bool,
  isSharedCollection: PropTypes.bool,
  handleClick: PropTypes.func,
  dragging: PropTypes.bool,
  menuOpen: PropTypes.bool,
  lastPinnedCard: PropTypes.bool,
  testCollectionCard: PropTypes.bool,
  searchResult: PropTypes.bool,
}

GridCard.defaultProps = {
  height: 1,
  canEditCollection: false,
  isSharedCollection: false,
  handleClick: () => null,
  dragging: false,
  menuOpen: false,
  lastPinnedCard: false,
  testCollectionCard: false,
  searchResult: false,
}

export default GridCard
