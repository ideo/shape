import _ from 'lodash'
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
} from '~/ui/grid/shared'
import TextActionMenu from '~/ui/grid/TextActionMenu'
import BottomLeftCardIcons from '~/ui/grid/BottomLeftCardIcons'
import ActionMenu from '~/ui/grid/ActionMenu'

import Activity from '~/stores/jsonApi/Activity'
import { routingStore, uiStore, apiStore } from '~/stores'

import Loader from '~/ui/layout/Loader'
import CollectionCardsTagEditorModal from '~/ui/pages/shared/CollectionCardsTagEditorModal'
import TextButton from '~/ui/global/TextButton'
import { NamedActionButton } from '~/ui/global/styled/buttons'
import CardActionHolder from '~/ui/icons/CardActionHolder'
import RestoreIcon from '~/ui/icons/RestoreIcon'
import FullScreenIcon from '~/ui/icons/FullScreenIcon'
import EditButton from '~/ui/reporting/EditButton'
import hexToRgba from '~/utils/hexToRgba'
import v from '~/utils/variables'
import { linkOffsite } from '~/utils/url'
import { pageBoundsScroller } from '~/utils/ScrollNearPageBoundsService'
import { openContextMenu } from '~/utils/clickUtils'

const CardLoader = () => {
  return (
    <div
      style={{
        top: 0,
        width: '100%',
        height: '100%',
        position: 'absolute',
        zIndex: v.zIndex.gridCardTop,
        background: hexToRgba(v.colors.commonDark, 0.5),
        color: 'white',
      }}
    >
      <Loader size={30} containerHeight="100%" animation="circular" />
    </div>
  )
}

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
      record,
      zoomLevel,
      card,
      canEditCollection,
      testCollectionCard,
      searchResult,
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
    if (this.isEditingCardCover) {
      className = 'hide-on-cover-edit'
    }

    return (
      <StyledTopRightActions
        color={this.actionsColor}
        className={className}
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
    const { menuItemCount, props } = this
    const { card } = props

    ev.preventDefault()
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
    const { record } = this.props
    if (record.internalType === 'collections') {
      return !!record.cover.image_url
    }
    return !!record.thumbnail_url
  }

  handleMoreCoverClick = ev => {
    this.defaultHandleClick(ev)
  }

  defaultHandleClick = ev => {
    pageBoundsScroller.setScrolling(false)
    const { cardType, record } = this.props
    if (uiStore.cardMenuOpenAndPositioned) {
      uiStore.closeCardMenu()
      return
    }
    const formTags = ['SELECT', 'OPTION']

    if (
      typeof ev.target.className !== 'string' ||
      // cancel for elements matching or inside a .cancelGridClick
      ev.target.className.match(/cancelGridClick/) ||
      ev.target.closest('.cancelGridClick') ||
      ev.target.className.match(/selectMenu/) ||
      // cancel for links within the card as these should handle their own routing
      (ev.target.tagName === 'A' && ev.target.href) ||
      formTags.includes(ev.target.tagName) ||
      record.type === 'Item::DataItem' ||
      ev.target.className.match(/CollectionCoverFormButton/)
    ) {
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
        const coverItem = _.get(record, 'collection_cover_items[0]')
        if (coverItem && coverItem.isLink) {
          this.linkOffsite(coverItem)
          return
        }
      }
      // default behavior -- route to Collection/Item
      routingStore.routeTo(cardType, record.id)
    })
  }

  handleClick = ev => {
    const { card, dragging, record } = this.props
    if (dragging || card.isLoadingPlaceholder) {
      return false
    }
    if (uiStore.captureKeyboardGridClick(ev, card.id)) {
      return
    }
    if (record.isLink) {
      this.linkOffsite(record)
      return
    }
    if (record.isPdfFile) {
      // TODO: could replace with preview
      Activity.trackActivity('downloaded', record)
      return
    } else if (record.isCreativeDifferenceChartCover) {
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
    routingStore.routeTo('items', card.record.id)
  }

  get coverItem() {
    const { collection_cover_items } = this.props.record
    if (!collection_cover_items || collection_cover_items.length === 0)
      return null
    return collection_cover_items[0]
  }

  get downloadableRecord() {
    const { record } = this.props
    const { coverItem } = this
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
    const { collection_cover_text_items } = record

    let nestedTextItem = null
    // Carousels have their own renderer in CollectionCover,
    // so don't behave the same as the other cover item types
    const isCoverItem =
      this.coverItem && record.cover_type !== 'cover_type_carousel'
    if (
      collection_cover_text_items &&
      collection_cover_text_items.length > 0 &&
      record.cover_type === 'cover_type_text_and_media'
    ) {
      // If this is a special cover with both image and text, pass the text
      // item through
      nestedTextItem = collection_cover_text_items[0]
    } else if (this.coverItem && record.cover_type !== 'cover_type_carousel') {
      // Instead use the item for the cover rather than the collection
      record = this.coverItem
      cardType = 'items'
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
        handleClick={this.defaultHandleClick}
        isBoardCollection={isBoardCollection}
        isTestCollectionCard={testCollectionCard}
        nestedTextItem={nestedTextItem}
      />
    )
  }

  get transparentBackground() {
    const { cardType, record } = this.props
    // If a data item and is a collection cover, it's transparent
    if (this.coverItem && this.coverItem.isData) return true
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
    } = this.props
    const showHotEdge =
      this.props.showHotEdge && canEditCollection && !card.isLoadingPlaceholder

    const firstCardInRow = card.position && card.position.x === 0
    const tagEditorOpen = uiStore.tagsModalOpenId === card.id
    const showRestore = searchResult && record.isRestorable

    return (
      <StyledGridCard
        background={
          this.transparentBackground ? v.colors.transparent : v.colors.white
        }
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
        onContextMenu={this.handleContextMenu}
        ref={c => (this.gridCardRef = c)}
        onMouseLeave={this.closeContextMenu}
        selected={this.isSelected || this.props.hoveringOver}
        inSearchPage={searchResult}
      >
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
          visibleOverflow={record.isReportTypeRecord}
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
          <BottomRightActionHolder onClick={this.handleMoreCoverClick}>
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
}

export default GridCard
