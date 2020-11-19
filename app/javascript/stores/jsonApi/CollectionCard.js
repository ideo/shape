import _ from 'lodash'
import { action, computed, observable, runInAction } from 'mobx'
import queryString from 'query-string'

import {
  ITEM_TYPES,
  COLLECTION_TYPES,
  COLLECTION_CARD_TYPES,
} from '~/utils/variables'
import { apiUrl } from '~/utils/url'
import FilestackUpload from '~/utils/FilestackUpload'
import TitleAndCoverEditingMixin from '~/stores/jsonApi/mixins/TitleAndCoverEditingMixin'
import BaseRecord from './BaseRecord'

class CollectionCard extends TitleAndCoverEditingMixin(BaseRecord) {
  static type = 'collection_cards'
  static endpoint = apiUrl('collection_cards')

  attributesForAPI = [
    'type',
    'order',
    'width',
    'height',
    'row',
    'col',
    'reference',
    'parent_id',
    'collection_id',
    'item_id',
    'collection_attributes',
    'item_attributes',
    'image_contain',
    'card_type',
    'is_cover',
    'is_background',
    'hidden',
    'filter',
    'section_type',
    'section_name',
    'cover_card_id',
    'cover',
  ]

  batchUpdateAttributes = [
    'id',
    'order',
    'width',
    'height',
    'row',
    'col',
    'pinned',
  ]

  @observable
  maxWidth = this.width || 1
  @observable
  maxHeight = this.height || 1
  @observable
  currentlyReplacing = false

  constructor(...args) {
    super(...args)
    if (!this.record) {
      // mainly for private cards which have no record
      this.record = {}
    }
  }

  @action
  setMaxWidth(w) {
    this.maxWidth = w
  }

  @action
  setMaxHeight(h) {
    this.maxHeight = h
  }

  // For cards that are positioned using row/col,
  // this is the row that they extend to
  get maxRow() {
    if (this.row === undefined || this.height === undefined) return 0
    return this.row + this.height - 1
  }

  get maxRowWithSections() {
    const { maxRow } = this
    if (!this.isSection || maxRow === 0) {
      return maxRow
    }
    // section corner is 1 row up
    return maxRow - 1
  }

  // For cards that are positioned using row/col,
  // this is the col that they extend to
  get maxCol() {
    if (this.col === undefined || this.width === undefined) return 0
    return this.col + this.width - 1
  }

  get maxColWithSections() {
    const { maxCol } = this
    if (!this.isSection || maxCol === 0) {
      return maxCol
    }
    // section corner is 1 row up
    return maxCol - 1
  }

  get isTestCollection() {
    return this.record.type === COLLECTION_TYPES.TEST
  }

  get isTextItem() {
    return this.record && this.record.type === ITEM_TYPES.TEXT
  }

  get isPinned() {
    return this.pinned
  }

  get isPinnedInTemplate() {
    return this.pinned && !this.pinned_and_locked
  }

  get isPrivate() {
    return this.private_card
  }

  get isPinnedAndLocked() {
    // pinned in a collection means it is locked in that place
    // i.e. pinned in a templated collection
    return this.pinned_and_locked
  }

  get isLoadingPlaceholder() {
    return this.type === COLLECTION_CARD_TYPES.PLACEHOLDER
  }

  get isBctPlaceholder() {
    return this.isLoadingPlaceholder && _.isEmpty(this.record)
  }

  get parentCollection() {
    if (this.parent) return this.parent
    if (this.parent_id) {
      return this.apiStore.find('collections', this.parent_id)
    }
    // `null` parent may result in an error depending on what you're trying to do
    return null
  }

  get canMove() {
    // basically replicating what's in Ability.rb
    return (
      !this.isPinnedAndLocked &&
      (this.can_edit_parent || (this.record && this.record.can_edit))
    )
  }

  get isLinkCard() {
    return this.type === COLLECTION_CARD_TYPES.LINK
  }

  get isSection() {
    return this.type === COLLECTION_CARD_TYPES.SECTION
  }

  get subtitle() {
    // Collection cards only show titles for link cards
    if (!this.isLinkCard) return null
    const { cover } = this
    const coverSubtitle = _.get(cover, 'hardcoded_subtitle', null)

    if (coverSubtitle) {
      return cover.subtitle_hidden ? '' : coverSubtitle
    }

    return this.linkedCoverSubtitleOrText
  }

  get subtitleHidden() {
    const { cover } = this
    return cover && cover.subtitle_hidden ? true : false
  }

  get subtitleForEditing() {
    if (!this.isLinkCard) return null
    const { cover } = this
    const coverSubtitle = _.get(cover, 'hardcoded_subtitle', null)
    return coverSubtitle || this.linkedCoverSubtitleOrText
  }

  get titleForEditing() {
    if (!this.isLinkCard) return null
    const { cover } = this
    return (cover && cover.hardcoded_title) || ''
  }

  get linkedCoverSubtitleOrText() {
    // used by collection_cards to fall-back to the linked record's subtitle
    if (!this.isLinkCard) {
      return null
    }

    const recordSubtitle = _.get(this, 'record.cover.hardcoded_subtitle', '')
    const recordText = _.get(this, 'record.cover.text', '')

    return recordSubtitle || recordText || ''
  }

  get coverImageUrl() {
    const { record } = this
    if (record.isCollection) {
      const collection = record
      // turn into normal object for overriding later w/out mobx issues
      const cover = { ...collection.cover }
      const cardCover = this.cover || {}

      if (this.isLinkCard)
        _.each(['image_url', 'image_handle'], field => {
          // allow cardCover to override collection cover if fields are present
          if (cardCover[field]) {
            cover[field] = cardCover[field]
          }
        })

      if (_.isEmpty(cover)) return null

      if (cover.image_handle) {
        return FilestackUpload.imageUrl({
          handle: cover.image_handle,
        })
      }
      return cover.image_url
    }
    return record.thumbnail_url
  }

  // This sets max W/H based on number of visible columns. Used by Grid + CollectionCover.
  // e.g. "maxWidth" might temporarily be 2 cols even though this card.width == 4
  @action
  calculateMaxSize(cols) {
    // max out width to the number of columns
    this.maxWidth = Math.min(cols, this.width)
    // generally only allow cards with height of 2 if we are displaying 4 columns
    this.maxHeight = Math.min(cols === 4 ? 2 : 1, this.height)
    // special case for tall cards, allow them to remain tall
    if (this.height === 2 && this.width === 1) {
      this.maxHeight = 2
      // except for text items at 1 column size, always shrink to 1x1
      if (this.isTextItem && cols <= 1) {
        this.maxHeight = 1
      }
    }
    // special case for large square tiles, they should remain at a square ratio
    if (this.width === this.height && this.width > 1) {
      if (cols === 1) {
        this.maxWidth = 1
        this.maxHeight = 1
      } else if (cols === 2) {
        this.maxWidth = 2
        this.maxHeight = 2
      }
    }
    return {
      cardWidth: this.maxWidth,
      cardHeight: this.maxHeight,
    }
  }

  @action
  beginReplacing() {
    this.uiStore.openBlankContentTool({
      order: this.order,
      row: this.row,
      col: this.col,
      width: this.width,
      height: this.height,
      replacingId: this.id,
    })
    this.currentlyReplacing = true
  }

  @action
  stopReplacing() {
    this.currentlyReplacing = false
  }

  async API_create() {
    const { uiStore } = this
    const { placeholderCard } = uiStore.blankContentToolState

    try {
      const data = this.toJsonApi()
      if (placeholderCard) {
        data.placeholder_card_id = placeholderCard.id
      }
      // NOTE: this intentionally does not use BaseRecord.create
      // so that we can deal with "hot-swapping" unpersisted text items
      const res = await this.apiStore.request('collection_cards', 'POST', {
        data,
      })
      const card = res.data
      runInAction(() => {
        // unset this so it does not call placeholderCard.API_destroy() when closing BCT
        uiStore.setBctPlaceholderCard(null)
        // important to close BCT before adding the new card so that the grid reflows properly
        uiStore.closeBlankContentTool({ force: true })
        const { record } = card
        if ((!record.name && record.isLink) || record.isData) {
          uiStore.addNewCard(card.record.id)
        }
        this.parentCollection.addCard(card)
        if (record.isText) {
          // now that create has finished, mark the newPersistedTextCard;
          // this will get picked up in GridCard#renderCover
          this.parentCollection.newPersistedTextCard = card
        }
        uiStore.trackEvent('create', this.parentCollection)
      })
      return res.data
    } catch (e) {
      uiStore.closeBlankContentTool({ force: true })
      uiStore.defaultAlertError()
      return false
    }
  }

  // TODO: see if this can be refactored into API_Create
  async API_createFromPlaceholderId(placeholderCardId) {
    const { uiStore } = this
    if (!placeholderCardId) return
    const data = this.toJsonApi()
    data.placeholder_card_id = placeholderCardId
    const res = await this.apiStore.request('collection_cards', 'POST', {
      data,
    })
    uiStore.trackEvent('create', this.parentCollection)
    return res.data
  }

  async API_createBct() {
    const { uiStore } = this
    try {
      await this.create('/create_bct')
      // `this` is now set to the newly created placeholder card
      uiStore.setBctPlaceholderCard(this)
    } catch (e) {
      uiStore.closeBlankContentTool({ force: true })
      uiStore.defaultAlertError()
      return false
    }
  }

  async API_replace({ replacingId = null, replacingCard = null }) {
    const { uiStore } = this
    try {
      // NOTE: in this context, `this` is a new CollectionCard model
      // that has the data we want to send for replacing the card
      let replacing = null

      if (replacingCard) {
        replacing = replacingCard
      } else if (replacingId) {
        replacing = this.apiStore.find('collection_cards', replacingId)
      }

      if (!replacing) {
        return
      }

      const data = this.toJsonApi()
      // need to remove the item to reset its type (in case it changed)
      this.apiStore.remove(replacing.record)
      // just give it a placeholder so that it doesn't totally disappear e.g. from TestDesigner
      replacing.record = {}
      const res = await this.apiStore.request(
        `collection_cards/${replacing.id}/replace`,
        'PATCH',
        { data }
      )
      uiStore.closeBlankContentTool()
      uiStore.trackEvent('replace', this.parentCollection)
      // can get rid of this temp model
      this.apiStore.remove(this)
      const card = res.data
      card.stopReplacing()
      return card
    } catch (e) {
      console.warn(e)
      uiStore.closeBlankContentTool({ force: true })
      uiStore.defaultAlertError()
      return false
    }
  }

  async API_destroy() {
    const { uiStore } = this
    if (!this.isBctPlaceholder && !this.parentCollection.isTestCollection) {
      // these are the only types that should actually call destroy
      return
    }
    try {
      this.destroyed = true
      this.destroy()
      this.parentCollection.removeCard(this)
      return
    } catch (e) {
      uiStore.defaultAlertError()
    }
  }

  async API_linkToMyCollection() {
    const { uiStore } = this
    const { selectedCardIds } = uiStore
    const viewingCollectionId = uiStore.viewingCollection
      ? uiStore.viewingCollection.id
      : this.parent_id
    const data = {
      to_id: this.apiStore.currentUser.current_user_collection_id,
      from_id: viewingCollectionId,
      collection_card_ids: selectedCardIds.length ? selectedCardIds : [this.id],
      placement: 'end',
    }
    try {
      await this.apiStore.request('collection_cards/link', 'POST', data)
      if (this.record && !this.record.in_my_collection) {
        this.record.in_my_collection = true
      }
      uiStore.alertOk('Added to your collection')
    } catch (e) {
      uiStore.defaultAlertError()
    }
  }

  async API_selectCardIdsBelow() {
    const { apiStore, uiStore } = this
    let selectedCardIds = []
    const params = {
      collection_card_id: this.id,
      direction: 'bottom',
    }

    try {
      selectedCardIds = await apiStore.requestJson(
        `collections/${
          this.parent_id
        }/collection_cards/ids_in_direction?${queryString.stringify(params)}`
      )
      uiStore.selectCardIds(selectedCardIds)
    } catch (e) {
      // TODO: when cards are unselectable?
      uiStore.defaultAlertError()
    }
    return selectedCardIds
  }

  // Only show archive popup if this is a collection that has cards
  // Don't show if empty collection, or just link card / item card(s)
  get shouldShowArchiveWarning() {
    return _.some(
      this.apiStore.selectedCards,
      card =>
        // look for any records you can't edit, that way this will trigger reselectOnlyEditableRecords()
        !card.record.can_edit ||
        // otherwise warn for collections w/ cards
        (!card.link &&
          card.record.className === 'Collection' &&
          card.record.collection_card_count > 0)
    )
  }

  @computed
  get isSelected() {
    return this.uiStore.isSelected(this.id)
  }

  get isMDLPlaceholder() {
    return _.includes(this.id, '-mdlPlaceholder')
  }

  // placeholder cards have a reference to the original card they are standing in for
  get original() {
    if (!this.originalId) return null
    return this.apiStore.find('collection_cards', this.originalId)
  }

  get isBeingMoved() {
    const { movingCardIds, cardAction } = this.uiStore
    // only count "being moved" for the move actions (not link, duplicate, etc)
    if (cardAction !== 'move') return false
    return _.includes(movingCardIds, this.id)
  }

  get isBeingMultiMoved() {
    const { uiStore } = this
    return _.includes(uiStore.multiMoveCardIds, this.id)
  }

  get isBeingMultiDragged() {
    return !this.isDragCardMaster && this.isBeingMultiMoved
  }

  get isDragCardMaster() {
    const { uiStore } = this
    return uiStore.dragCardMaster === this.id
  }

  get shouldHideFromUI() {
    const { uiStore, parentCollection } = this
    if (parentCollection && !parentCollection.isBoard && this.private_card) {
      return true
    }
    return (
      ((uiStore.dragging || uiStore.movingIntoCollection) &&
        uiStore.cardAction === 'move' &&
        this.isBeingMultiDragged) ||
      this.isBeingMoved ||
      this.currentlyReplacing ||
      this.hidden
    )
  }

  get introSection() {
    return this.section_type === 'intro'
  }

  get ideasSection() {
    return this.section_type === 'ideas'
  }

  get outroSection() {
    return this.section_type === 'outro'
  }

  async API_archiveSelf({ undoable = true } = {}) {
    try {
      await this.apiStore.archiveCards({
        cardIds: [this.id],
        collection: this.parentCollection,
        undoable,
      })
      return
    } catch (e) {
      this.uiStore.defaultAlertError()
    }
  }

  // this could really be a static method now that it archives all selected cards
  async API_archive({ isReplacing = false, onCancel = null } = {}) {
    const { uiStore } = this
    const { selectedCardIds } = uiStore
    const collection = this.parentCollection

    if (this.shouldShowArchiveWarning) {
      const popupAgreed = new Promise((resolve, reject) => {
        let prompt = 'Are you sure you want to delete this?'
        const confirmText = 'Delete'
        let iconName = 'Trash'
        let snoozeChecked = null
        let onToggleSnoozeDialog = null

        const removedCount = uiStore.reselectOnlyEditableRecords(
          selectedCardIds
        )

        if (selectedCardIds.length === 0) {
          prompt = 'Insufficient permission to delete.'
          if (collection.isTemplated && removedCount > 0) {
            iconName = 'Template'
            prompt = 'Pinned cards in a template instance can not be deleted.'
          }
          this.uiStore.alert(prompt, iconName)
          return
        }

        if (collection.isTemplate && collection.shouldShowEditWarning) {
          ;({
            snoozeChecked,
            prompt,
            onToggleSnoozeDialog,
          } = collection.confirmEditOptions)
        } else {
          prompt = 'Are you sure you want to delete '
          if (selectedCardIds.length > 1) {
            prompt += `these ${selectedCardIds.length} objects?`
          } else {
            if (this.link) {
              iconName = 'Link'
              prompt += 'this link?'
            } else if (this.isTestCollection) {
              prompt += 'this test? It will close your feedback.'
            } else {
              prompt += 'this?'
            }
          }
        }
        this.uiStore.confirm({
          prompt,
          confirmText,
          iconName,
          onToggleSnoozeDialog,
          snoozeChecked,
          onCancel: () => {
            if (_.isFunction(onCancel)) {
              onCancel()
            }
            resolve(false)
          },
          onConfirm: () => resolve(true),
        })
      })
      const agreed = await popupAgreed
      if (!agreed) return false
    }
    try {
      await this.apiStore.archiveCards({
        // turn into normal JS array
        cardIds: selectedCardIds.toJS(),
        collection,
      })
      // collection may be undefined e.g. if we're archiving from the header actionmenu
      if (collection) {
        collection.removeCardIds(selectedCardIds)
        uiStore.trackEvent('archive', collection)
        if (
          collection.collection_cards.length === 0 &&
          !collection.isBoard &&
          !collection.isSubmissionsCollection
        ) {
          uiStore.openBlankContentTool()
        }
      }
      uiStore.deselectCards()
      return true
    } catch (e) {
      // re-fetch collection
      if (collection) {
        this.apiStore.fetch('collections', collection.id, true)
      }
      console.warn(e)
      uiStore.defaultAlertError()
    }
    return false
  }

  @action
  async API_togglePin() {
    // toggle it first
    this.pinned = !this.pinned
    await this.apiStore.request(
      `collection_cards/${this.id}/toggle_pin`,
      'PATCH',
      {
        pinned: this.pinned,
      }
    )
    // make sure this card, if it moved, is the "tiebreaker" for its new order
    this.order -= 0.5

    return this.parentCollection._reorderCards()
  }

  @action
  async API_updateCardFilter(filter) {
    if (!filter) return
    this.filter = filter

    await this.apiStore.request(
      `collection_cards/${this.id}/update_card_filter`,
      'PATCH',
      { data: this.toJsonApi() }
    )
  }
}

export default CollectionCard
