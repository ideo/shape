import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { observable, action } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import ContainImage from '~/ui/grid/ContainImage'
import CoverImageToggle from '~/ui/grid/CoverImageToggle'
import CoverImageSelector from '~/ui/grid/CoverImageSelector'
import GridCardHotspot from '~/ui/grid/GridCardHotspot'
import CoverRenderer from '~/ui/grid/CoverRenderer'

import Activity from '~/stores/jsonApi/Activity'
import ActionMenu from '~/ui/grid/ActionMenu'
import CardActionHolder from '~/ui/icons/CardActionHolder'
import CollectionIcon from '~/ui/icons/CollectionIcon'
import EditButton from '~/ui/reporting/EditButton'
import { NamedActionButton } from '~/ui/global/styled/buttons'
import FullScreenIcon from '~/ui/icons/FullScreenIcon'
import LinkIcon from '~/ui/icons/LinkIcon'
import HiddenIconButton from '~/ui/icons/HiddenIconButton'
import Download from '~/ui/grid/Download'
import LinkedCollectionIcon from '~/ui/icons/LinkedCollectionIcon'
import RequiredCollectionIcon from '~/ui/icons/RequiredCollectionIcon'
import RestoreIcon from '~/ui/icons/RestoreIcon'
import PinnedIcon from '~/ui/icons/PinnedIcon'
import SelectionCircle from '~/ui/grid/SelectionCircle'
import TagEditorModal from '~/ui/pages/shared/TagEditorModal'
import Tooltip from '~/ui/global/Tooltip'
import { routingStore, uiStore } from '~/stores'
import v, { ITEM_TYPES, EVENT_SOURCE_TYPES } from '~/utils/variables'
import { calculatePopoutMenuOffset } from '~/utils/clickUtils'
import ReplaceCardButton from '~/ui/grid/ReplaceCardButton'
import FoamcoreBoardIcon from '~/ui/icons/FoamcoreBoardIcon'
import {
  StyledGridCard,
  StyledBottomLeftIcon,
  StyledGridCardInner,
  StyledTopRightActions,
} from './shared'

@observer
class GridCard extends React.Component {
  @observable
  menuItemCount = 1
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
      } else if (record.isBoard) {
        icon = <FoamcoreBoardIcon />
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
    const { isItem } = this
    if (
      record.is_private ||
      (record.isSubmission && record.submission_attrs.hidden)
    ) {
      return (
        <HiddenIconButton
          clickable={record.can_edit && record.is_private}
          size="sm"
          record={record}
          IconWrapper={({ children }) => (
            <StyledBottomLeftIcon small iconAmount={1} iconPos={isItem ? 1 : 2}>
              {children}
            </StyledBottomLeftIcon>
          )}
        />
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

  renderReplaceControl() {
    const { card, canEditCollection } = this.props
    if (!canEditCollection) return null
    const { record } = card
    if (!record.isMedia) return
    if (!card.is_master_template_card && !card.isPinned) return null
    if (!card.is_master_template_card && card.record.has_replaced_media)
      return null
    return (
      <ReplaceCardButton
        card={card}
        canEditCollection={canEditCollection}
        // observe button update
        showReplace={card.show_replace}
      />
    )
  }

  @action
  getMenuItemsCount = count => {
    // counts menuitems in actionmenu
    this.menuItemCount = count
  }

  openMenu = (ev, { x = 0, y = 0 } = {}) => {
    const { menuItemCount, props } = this
    const { card } = props

    // use util method to dynamically move the component on open
    const positionOffset = calculatePopoutMenuOffset(
      ev,
      EVENT_SOURCE_TYPES.GRID_CARD,
      menuItemCount
    )
    const { offsetX, offsetY } = positionOffset

    if (this.props.menuOpen) {
      uiStore.closeCardMenu()
    } else {
      uiStore.openCardMenu(card.id, {
        x,
        y,
        offsetX,
        offsetY,
      })
    }
  }

  openContextMenu = ev => {
    ev.preventDefault()
    const rect = this.gridCardRef.getBoundingClientRect()
    const x = ev.clientX - rect.left - rect.width * 0.95
    const y = ev.clientY - rect.top - 15

    // this is responsible for making fixed: false

    this.openMenu(ev, { x, y })
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
    card.parentCollection.reassignCover(card)
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
    } else if (record.isVideo || record.isImage || record.isLegend) {
      return
    } else if (record.mimeBaseType === 'image') {
      this.props.handleClick(e)
      return
    } else if (record.isGenericFile) {
      // TODO: could replace with preview
      this.linkOffsite(record.fileUrl())
      return
    }
    // capture breadcrumb trail when navigating via Link cards, but not from My Collection
    if (card.link) {
      this.storeLinkedBreadcrumb(card)
    }

    this.props.handleClick(e)
  }

  handleRestore = ev => {
    ev.preventDefault()
    ev.stopPropagation()
    const { record } = this.props
    record.restore()
  }

  storeLinkedBreadcrumb = card => {
    if (uiStore.isViewingHomepage) return
    const { record } = card
    // get a plain JS copy of breadcrumb
    const breadcrumb = [...uiStore.viewingRecord.breadcrumb]
    const { inMyCollection } = uiStore.viewingRecord
    uiStore.update('actionAfterRoute', () => {
      uiStore.updateLinkedBreadcrumbTrail({
        breadcrumb,
        inMyCollection,
        record,
      })
    })
  }

  goToPage = card => {
    if (card.link) {
      this.storeLinkedBreadcrumb(card)
    }
    routingStore.routeTo('items', card.record.id, { name: card.record.name })
  }

  get coverItem() {
    const { collection_cover_items } = this.props.record
    if (!collection_cover_items || collection_cover_items.length === 0)
      return null
    return collection_cover_items[0]
  }

  get renderCover() {
    const {
      card,
      height,
      dragging,
      searchResult,
      handleClick,
      isBoardCollection,
      testCollectionCard,
    } = this.props
    let { record, cardType } = this.props

    let nestedTextItem = null
    if (this.coverItem && record.cover_type === 'cover_type_text_and_media') {
      // If this is a special cover with both image and text, pass the text
      // item through
      nestedTextItem = this.coverItem
    } else if (this.coverItem) {
      // Instead use the item for the cover rather than the collection
      record = this.coverItem
      cardType = 'items'
    }

    return (
      <CoverRenderer
        card={card}
        cardType={cardType}
        isCoverItem={this.coverItem ? true : false}
        record={record}
        height={height}
        dragging={dragging}
        searchResult={searchResult}
        handleClick={handleClick}
        isBoardCollection={isBoardCollection}
        isTestCollectionCard={testCollectionCard}
        nestedTextItem={nestedTextItem}
      />
    )
  }

  get transparentBackground() {
    const { cardType, record } = this.props
    // If this is a legend or data item, it's transparent
    if (cardType === 'items' && (record.isLegend || record.isData)) return true
    // If a data item and is a collection cover, it's transparent
    if (this.coverItem && this.coverItem.isData) return true

    return false
  }

  get location() {
    const { searchResult } = this.props
    return searchResult ? 'Search' : 'GridCard'
  }

  get offsetPosition() {
    return {
      x: uiStore.cardMenuOpen.offsetX,
      y: uiStore.cardMenuOpen.offsetY,
    }
  }

  render() {
    const {
      card,
      record,
      canEditCollection,
      dragging,
      draggingMultiple,
      menuOpen,
      lastPinnedCard,
      testCollectionCard,
      searchResult,
      showHotEdge,
      zoomLevel,
    } = this.props

    const firstCardInRow = card.position && card.position.x === 0
    const tagEditorOpen = uiStore.tagsModalOpenId === card.id
    const showRestore = searchResult && record.isRestorable

    return (
      <StyledGridCard
        background={this.transparentBackground ? 'transparent' : 'white'}
        className="gridCard"
        id={`gridCard-${card.id}`}
        dragging={dragging}
        draggingMultiple={draggingMultiple}
        testCollectionCard={testCollectionCard}
        unclickable={testCollectionCard || record.isImage} // mostly for E2E checking purposes
        data-width={card.width}
        data-height={card.height}
        data-order={card.order}
        data-cy="GridCard"
        onContextMenu={this.openContextMenu}
        innerRef={c => (this.gridCardRef = c)}
        onMouseLeave={this.closeContextMenu}
        selected={this.isSelected || this.props.hoveringOver}
      >
        {canEditCollection &&
          showHotEdge &&
          (!card.isPinnedAndLocked || lastPinnedCard) && (
            <GridCardHotspot card={card} dragging={dragging} />
          )}
        {canEditCollection &&
          showHotEdge &&
          firstCardInRow &&
          !card.isPinnedAndLocked && (
            <GridCardHotspot card={card} dragging={dragging} position="left" />
          )}
        {this.renderReplaceControl()}
        {!record.menuDisabled &&
          uiStore.textEditingItem !== record &&
          !record.archived && (
            <StyledTopRightActions
              color={this.actionsColor}
              className="show-on-hover"
              zoomLevel={zoomLevel}
            >
              {record.isDownloadable && <Download record={record} />}
              {record.canSetACover && (
                <CoverImageSelector card={card} parentRef={this.gridCardRef} />
              )}
              {record.canBeSetAsCover && canEditCollection && (
                <CoverImageToggle
                  card={card}
                  onReassign={this.onCollectionCoverChange}
                />
              )}
              {record.isData && record.isReportTypeCollectionsItems && (
                <EditButton onClick={this.editCard} />
              )}
              {record.isImage && this.canContentEditCard && (
                <ContainImage card={card} image_contain={card.image_contain} />
              )}
              {(record.isImage || record.isText) && (
                <CardActionHolder
                  className="show-on-hover"
                  onClick={() => this.goToPage(card)}
                  tooltipText="go to page"
                >
                  <FullScreenIcon />
                </CardActionHolder>
              )}
              {!testCollectionCard && (
                <CardActionHolder tooltipText="select">
                  <SelectionCircle cardId={card.id} />
                </CardActionHolder>
              )}
              <ActionMenu
                location={this.location}
                className="show-on-hover"
                wrapperClassName="card-menu"
                card={card}
                canView={record.can_view}
                canEdit={this.canEditCard}
                canReplace={record.canReplace && !card.link && !searchResult}
                direction={uiStore.cardMenuOpen.direction}
                offsetPosition={this.offsetPosition}
                menuOpen={menuOpen}
                onOpen={this.openMenu}
                onLeave={this.closeMenu}
                testCollectionCard={testCollectionCard}
                menuItemsCount={this.getMenuItemsCount}
              />
            </StyledTopRightActions>
          )}
        {this.renderIcon}
        {this.renderHidden}
        {/* onClick placed here so it's separate from hotspot click */}
        <StyledGridCardInner
          onClick={this.handleClick}
          hasOverflow={record.isData || record.isLegend}
          filter={card.filter}
          forceFilter={!this.hasCover}
          isText={record.isText}
        >
          {showRestore && (
            <StyledTopRightActions
              color={this.actionsColor}
              zoomLevel={zoomLevel}
            >
              <NamedActionButton onClick={this.handleRestore}>
                <RestoreIcon />
                Restore
              </NamedActionButton>
            </StyledTopRightActions>
          )}
          {this.renderCover}
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
  isBoardCollection: PropTypes.bool,
  handleClick: PropTypes.func,
  dragging: PropTypes.bool,
  hoveringOver: PropTypes.bool,
  menuOpen: PropTypes.bool,
  lastPinnedCard: PropTypes.bool,
  testCollectionCard: PropTypes.bool,
  searchResult: PropTypes.bool,
  draggingMultiple: PropTypes.bool,
  showHotEdge: PropTypes.bool,
  zoomLevel: PropTypes.number,
}

GridCard.defaultProps = {
  height: 1,
  canEditCollection: false,
  isSharedCollection: false,
  isBoardCollection: false,
  handleClick: () => null,
  dragging: false,
  hoveringOver: false,
  menuOpen: false,
  lastPinnedCard: false,
  testCollectionCard: false,
  draggingMultiple: false,
  searchResult: false,
  showHotEdge: true,
  zoomLevel: 1,
}

export default GridCard
