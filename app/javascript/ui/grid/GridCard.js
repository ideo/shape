import _ from 'lodash'
import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { observable, computed, action } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import ContainImage from '~/ui/grid/ContainImage'
import CoverImageToggle from '~/ui/grid/CoverImageToggle'
import CardCoverEditor from '~/ui/grid/CardCoverEditor'
import GridCardHotspot from '~/ui/grid/GridCardHotspot'
import CoverRenderer from '~/ui/grid/CoverRenderer'
import Download from '~/ui/grid/Download'
import SelectionCircle from '~/ui/grid/SelectionCircle'
import ReplaceCardButton from '~/ui/grid/ReplaceCardButton'
import {
  BottomRightActionHolder,
  StyledGridCard,
  StyledGridCardInner,
  StyledTopRightActions,
  StyledGridCardPrivate,
} from '~/ui/grid/shared'
import CardLoader from '~/ui/grid/loader/CardLoader'
import PlaceholderCard from '~/ui/grid/PlaceholderCard'
import TextActionMenu from '~/ui/grid/TextActionMenu'
import BottomLeftCardIcons from '~/ui/grid/BottomLeftCardIcons'
import ActionMenu from '~/ui/grid/ActionMenu'

import Activity from '~/stores/jsonApi/Activity'
import { routingStore, uiStore, apiStore } from '~/stores'

import CollectionCardsTagEditorModal from '~/ui/pages/shared/CollectionCardsTagEditorModal'
import TextButton from '~/ui/global/TextButton'
import { NamedActionButton } from '~/ui/global/styled/buttons'
import CardActionHolder from '~/ui/icons/CardActionHolder'
import HiddenIcon from '~/ui/icons/HiddenIcon'
import RestoreIcon from '~/ui/icons/RestoreIcon'
import FullScreenIcon from '~/ui/icons/FullScreenIcon'
import EditButton from '~/ui/reporting/EditButton'
import propShapes from '~/utils/propShapes'
import v from '~/utils/variables'
import { getCollaboratorColor } from '~/utils/colorUtils'
import { linkOffsite } from '~/utils/url'
import { pageBoundsScroller } from '~/utils/ScrollNearPageBoundsService'
import { openContextMenu } from '~/utils/clickUtils'

@observer
class GridCard extends React.Component {
  lastClickTimestamp = null
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

  @computed
  get isSelected() {
    const { card } = this.props
    return uiStore.selectedCardIds.findIndex(id => id === card.id) > -1
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

  get isEditingCardCover() {
    const { card } = this.props
    const { id } = card
    // uiStore.editingCardCover gets set when handleClick is fired when edit icon is clicked
    return uiStore.editingCardCover === id
  }

  @computed
  get menuOpen() {
    return uiStore.actionMenuOpenForCard(this.props.card.id)
  }

  renderTopRightActions() {
    const { menuOpen } = this
    const {
      card,
      canEditCollection,
      record,
      searchResult,
      testCollectionCard,
      zoomLevel,
    } = this.props

    if (
      record.menuDisabled ||
      uiStore.textEditingItem === record ||
      record.archived ||
      card.isLoadingPlaceholder
    ) {
      return null
    }

    let className = 'show-on-hover'
    if (this.isEditingCardCover || uiStore.selectedArea.minX) {
      className = 'hidden-actions'
    }

    const cardWidth = uiStore.gridSettings.gridW / zoomLevel
    const smallCard = cardWidth < 160

    return (
      <StyledTopRightActions
        color={this.actionsColor}
        className={className}
        forceOpen={this.touchActionMenuOpen}
        smallCard={smallCard}
        zoomLevel={zoomLevel}
      >
        {this.downloadableRecord && (
          <Download record={this.downloadableRecord} />
        )}
        {record.canSetACover && this.canContentEditCard && (
          <CardCoverEditor
            card={card}
            parentRef={this.gridCardRef}
            isEditingCardCover={this.isEditingCardCover}
          />
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
          menuOpen={menuOpen}
          onOpen={this.openActionMenu}
          onLeave={this.closeMenu}
          testCollectionCard={testCollectionCard}
          menuItemsCount={this.getMenuItemsCount}
          zoomLevel={zoomLevel}
        />
      </StyledTopRightActions>
    )
  }

  renderReplaceControl() {
    const { card, canEditCollection } = this.props
    if (!canEditCollection) return null
    const { record } = card
    if (!record.isMedia) return
    if (card.is_master_template_card) {
      return (
        <ReplaceCardButton
          card={card}
          showControls={canEditCollection}
          // observe button update
          showReplace={card.show_replace}
        />
      )
    }
    if (
      card.parentCollection.isTemplated &&
      card.show_replace &&
      !card.record.has_replaced_media
    ) {
      return <ReplaceCardButton card={card} />
    }
  }

  @action
  getMenuItemsCount = count => {
    // counts menuitems in actionmenu
    this.menuItemCount = count
  }

  openActionMenu = ev => {
    const { menuItemCount } = this
    const { card } = this.props

    uiStore.openContextMenu(ev, {
      card,
      menuItemCount,
    })
  }

  handleContextMenu = ev => {
    ev.preventDefault()
    const { menuItemCount, props } = this
    const { card } = props
    if (card.isPrivate) {
      return
    }
    // for some reason, Android treats long-press as right click
    if (uiStore.isAndroid) return false

    return openContextMenu(ev, card, {
      targetRef: this.gridCardRef,
      onOpenMenu: uiStore.openContextMenu,
      menuItemCount,
    })
  }

  closeMenu = () => {
    // this happens when you mouse off the ActionMenu
    if (this.menuOpen) {
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

  // Only data cards are editable right now
  editCard = ev => {
    ev.preventDefault()
    const { card } = this.props
    uiStore.setEditingCardCover(card.id)
  }

  onCollectionCoverChange = () => {
    const { card } = this.props
    // Reassign the previous cover when a new cover is assigned as the backend will have changed.
    card.parentCollection.reassignCover(card)
  }

  get hasCover() {
    const { card } = this.props
    return !!card.coverImageUrl
  }

  @computed
  get touchActionMenuOpen() {
    const { card } = this.props
    return uiStore.touchActionMenuOpenId === card.id
  }

  defaultHandleClick = ev => {
    pageBoundsScroller.setScrolling(false)
    const { cardType, record } = this.props
    if (uiStore.cardMenuOpenAndPositioned) {
      uiStore.closeCardMenu()
      return
    }

    // check if we should cancel default click (i.e. do not route to the card)
    // cancel when clicking form tags inside the card
    const isFormTag = ['SELECT', 'OPTION'].includes(ev.target.tagName)
    // cancel for elements matching or inside a .cancelGridClick
    const cancelGridClick =
      (_.isString(ev.target.className) &&
        (ev.target.className.match(/cancelGridClick/) ||
          ev.target.className.match(/selectMenu/) ||
          ev.target.className.match(/CollectionCoverFormButton/))) ||
      (_.isFunction(ev.target.closest) && ev.target.closest('.cancelGridClick'))
    // cancel for links within the card as these should handle their own routing
    const isHref = ev.target.tagName === 'A' && ev.target.href

    // also cancel clicks for DataItems
    if (record.isData || cancelGridClick || isHref || isFormTag) {
      return
    }

    if (!record.can_view) {
      uiStore.showPermissionsAlert()
      return
    }

    // timeout is just a stupid thing so that Draggable doesn't complain about unmounting
    setTimeout(() => {
      if (record.isCarousel) {
        // special behavior for carousels with LinkItems
        const { coverItem } = record
        if (coverItem && coverItem.isLink) {
          this.linkOffsite(coverItem)
          return
        }
      }
      // default behavior -- route to Collection/Item
      routingStore.routeTo(cardType, record.id)
    })
  }

  onMainClickAction(ev) {
    const { card, record } = this.props
    uiStore.closeTouchActionMenu()
    if (record.isLink) {
      this.linkOffsite(record)
      return
    }
    if (record.isPdfFile) {
      // TODO: could replace with preview
      Activity.trackActivity('downloaded', record)
      return
    } else if (record.isCreativeDifferenceChartCover) {
      // make sure creativeDifferenceChartCover navigates to the collection
      this.defaultHandleClick(ev)
      return
    } else if (record.isVideo || record.isImage || record.isLegend) {
      return
    } else if (record.mimeBaseType === 'image') {
      this.defaultHandleClick(ev)
      return
    } else if (record.isGenericFile) {
      // TODO: could replace with preview
      this.linkOffsite(record, 'fileUrl')
      return
    }
    // capture breadcrumb trail when navigating via Link cards, but not from My Collection
    if (card.link) {
      this.storeLinkedBreadcrumb(card)
    }
    this.defaultHandleClick(ev)
  }

  handleClick = ev => {
    const { card, dragging } = this.props
    // Check for double click
    const now = new Date().getTime()
    const timeDiff = now - this.lastClickTimestamp
    if (timeDiff < 600 && timeDiff > 0) {
      return this.handleDoubleClick(ev)
    }
    this.lastClickTimestamp = new Date().getTime()

    if (dragging || card.isLoadingPlaceholder) {
      return false
    }
    if (uiStore.captureKeyboardGridClick(ev, card.id)) {
      return
    }
    if (uiStore.isTouchDevice) {
      uiStore.openTouchActionMenu(card.id)
      return
    }
    this.onMainClickAction(ev)
  }

  handleDoubleClick = ev => {
    ev.preventDefault()
    ev.stopPropagation()
    this.onMainClickAction(ev)
  }

  handleRestore = ev => {
    ev.preventDefault()
    ev.stopPropagation()
    const { record } = this.props
    record.restore()
  }

  linkOffsite = (record, field) => {
    linkOffsite(record, field, () => {
      Activity.trackActivity('viewed', record)
    })
  }

  storeLinkedBreadcrumb = card => {
    if (uiStore.isViewingHomepage) return
    const { record } = card
    // get a plain JS copy of breadcrumb
    const breadcrumb = [...uiStore.viewingRecord.breadcrumb]
    const inMyCollection = uiStore.viewingRecord.in_my_collection
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
    routingStore.routeTo('items', card.record.id)
  }

  get downloadableRecord() {
    const { record } = this.props
    const { coverItem } = record
    if (record.isDownloadable) {
      return record
    }
    if (coverItem && coverItem.isDownloadable) {
      return coverItem
    }
    return null
  }

  get renderCover() {
    const {
      card,
      height,
      dragging,
      searchResult,
      isBoardCollection,
      testCollectionCard,
    } = this.props
    let { record, cardType } = this.props
    const { coverItem, collection_cover_text_items } = record

    let nestedTextItem = null
    // Carousels have their own renderer in CollectionCover,
    // so don't behave the same as the other cover item types
    const isCoverItem = coverItem && record.cover_type !== 'cover_type_carousel'
    if (
      collection_cover_text_items &&
      collection_cover_text_items.length > 0 &&
      record.cover_type === 'cover_type_text_and_media'
    ) {
      // If this is a special cover with both image and text, pass the text
      // item through
      nestedTextItem = collection_cover_text_items[0]
    } else if (coverItem && record.cover_type !== 'cover_type_carousel') {
      // Instead use the item for the cover rather than the collection
      record = coverItem
      cardType = 'items'
    }

    const { viewingCollection } = uiStore
    if (
      !card.persisted &&
      viewingCollection &&
      viewingCollection.newPersistedTextCard
    ) {
      // special case, the new text item has just finished getting created
      // so we want to swap the card.record (unpersisted fake item) with the real one
      record = viewingCollection.newPersistedTextCard.record
    }

    return (
      <CoverRenderer
        card={card}
        cardType={cardType}
        isLoadingPlaceholder={card.isLoadingPlaceholder}
        isCoverItem={isCoverItem}
        record={record}
        height={height}
        dragging={dragging}
        searchResult={searchResult}
        // NOTE: handleClick is really only used by TextItemCover
        handleClick={this.defaultHandleClick}
        isBoardCollection={isBoardCollection}
        isTestCollectionCard={testCollectionCard}
        nestedTextItem={nestedTextItem}
      />
    )
  }

  get transparentBackground() {
    const { cardType, record, card } = this.props
    // If a data item and is a collection cover, or it's a placeholder it's transparent
    if ((record.coverItem && record.coverItem.isData) || card.isBctPlaceholder)
      return true
    // If this is a legend, data or text item it's transparent
    if (
      cardType === 'items' &&
      (record.isLegend || record.isData || record.isText)
    ) {
      return true
    }

    return false
  }

  get location() {
    const { searchResult } = this.props
    return searchResult ? 'Search' : 'GridCard'
  }

  get cardsForTagging() {
    if (apiStore.selectedCards.length > 0) {
      return apiStore.selectedCards
    } else {
      const { card } = this.props
      return [card]
    }
  }

  setCardRef(ref) {
    const { card } = this.props
    this.gridCardRef = ref
    if (!ref) return
    uiStore.setCardPosition(card.id, ref.getBoundingClientRect())
  }

  render() {
    const {
      card,
      cardType,
      record,
      canEditCollection,
      dragging,
      draggingMultiple,
      lastPinnedCard,
      testCollectionCard,
      searchResult,
      zoomLevel,
      collaborator,
    } = this.props
    const showHotEdge =
      this.props.showHotEdge && canEditCollection && !card.isLoadingPlaceholder

    const firstCardInRow = card.position && card.position.x === 0
    const tagEditorOpen = uiStore.tagsModalOpenId === card.id
    const showRestore = searchResult && record.isRestorable

    let contents
    if (card.isPrivate) {
      contents = (
        <StyledGridCardPrivate>
          <HiddenIcon />
        </StyledGridCardPrivate>
      )
    } else if (card.isBctPlaceholder) {
      const { droppingFilesCount } = uiStore
      const { row, col } = uiStore.blankContentToolState

      let warnBeforeLeaving = false

      if (row === card.row && col === card.col) {
        warnBeforeLeaving = true
      } else if (droppingFilesCount > 0) {
        // will technically mark other collaborator's placeholders as true
        // but this is still correct when the user is dropping files
        warnBeforeLeaving = true
      }

      contents = (
        <PlaceholderCard
          card={card}
          warnBeforeLeaving={warnBeforeLeaving}
          collaborator={collaborator}
        />
      )
    } else {
      contents = (
        <Fragment>
          <StyledTopRightActions>
            <TextActionMenu card={card} />
          </StyledTopRightActions>
          {showHotEdge && firstCardInRow && !card.isPinnedAndLocked && (
            <GridCardHotspot card={card} dragging={dragging} position="left" />
          )}
          {showHotEdge && (!card.isPinnedAndLocked || lastPinnedCard) && (
            <GridCardHotspot card={card} dragging={dragging} />
          )}
          {this.renderReplaceControl()}
          {this.renderTopRightActions()}
          {uiStore.viewingRecord && !uiStore.viewingRecord.isTestCollection && (
            <BottomLeftCardIcons
              card={card}
              cardType={cardType}
              record={record}
            />
          )}
          {/* onClick placed here so it's separate from hotspot click */}
          <StyledGridCardInner
            onClick={this.handleClick}
            hasOverflow={record.isData || record.isLegend || record.isText}
            filter={card.filter}
            forceFilter={!this.hasCover}
            isText={record.isText}
            visibleOverflow={
              record.isReportTypeRecord || record.isCreativeDifferenceChartCover
            }
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
            {card.isLoadingPlaceholder && <CardLoader />}
            {this.renderCover}
          </StyledGridCardInner>
          {record.isCreativeDifferenceChartCover && (
            <BottomRightActionHolder onClick={this.defaultHandleClick}>
              <TextButton fontSizeEm={0.75} color={v.colors.black}>
                More…
              </TextButton>
            </BottomRightActionHolder>
          )}
          <CollectionCardsTagEditorModal
            cards={this.cardsForTagging}
            canEdit={this.canEditCard}
            open={tagEditorOpen}
          />
        </Fragment>
      )
    }

    return (
      <StyledGridCard
        background={
          this.transparentBackground ? v.colors.transparent : v.colors.white
        }
        collaboratorColor={getCollaboratorColor(collaborator)}
        className="gridCard"
        id={`gridCard-${card.id}`}
        dragging={dragging}
        draggingMultiple={draggingMultiple}
        testCollectionCard={testCollectionCard}
        unclickable={testCollectionCard || record.isImage} // mostly for E2E checking purposes
        data-width={card.width}
        data-height={card.height}
        data-order={card.order}
        data-col={card.col}
        data-row={card.row}
        data-cy="GridCard"
        onContextMenu={this.handleContextMenu}
        ref={r => this.setCardRef(r)}
        selected={this.isSelected || this.props.hoveringOver}
        inSearchPage={searchResult}
      >
        {contents}
      </StyledGridCard>
    )
  }
}

GridCard.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  cardType: PropTypes.string,
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  collaborator: PropTypes.shape(propShapes.collaborator),
  height: PropTypes.number,
  canEditCollection: PropTypes.bool,
  isSharedCollection: PropTypes.bool,
  isBoardCollection: PropTypes.bool,
  dragging: PropTypes.bool,
  hoveringOver: PropTypes.bool,
  lastPinnedCard: PropTypes.bool,
  testCollectionCard: PropTypes.bool,
  searchResult: PropTypes.bool,
  draggingMultiple: PropTypes.bool,
  showHotEdge: PropTypes.bool,
  zoomLevel: PropTypes.number,
}

GridCard.defaultProps = {
  cardType: null,
  height: 1,
  canEditCollection: false,
  isSharedCollection: false,
  isBoardCollection: false,
  dragging: false,
  hoveringOver: false,
  lastPinnedCard: false,
  testCollectionCard: false,
  draggingMultiple: false,
  searchResult: false,
  showHotEdge: true,
  zoomLevel: 1,
  collaborator: null,
}

export default GridCard
