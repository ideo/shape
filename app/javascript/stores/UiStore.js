import _ from 'lodash'
import { animateScroll } from 'react-scroll'
import { observable, action, computed } from 'mobx'

export default class UiStore {
  // store this for usage by other components
  scroll = animateScroll
  defaultBCTState = {
    order: null,
    width: null,
    height: null,
    replacingId: null,
    emptyCollection: false,
  }
  @observable blankContentToolState = { ...this.defaultBCTState }
  @observable openCardMenuId = false
  @observable organizationMenuPage = null
  @observable rolesMenuOpen = false
  @observable isTouchDevice = (
    // https://hacks.mozilla.org/2013/04/detecting-touch-its-the-why-not-the-how/
    ('ontouchstart' in window) ||
     (navigator.maxTouchPoints > 0) ||
     (navigator.msMaxTouchPoints > 0)
  )
  @observable pageMenuOpen = false
  @observable tagsModalOpen = false
  defaultGridSettings = {
    // layout will track we are at "size 3" i.e. "small 4 cols" even though cols === 4
    layoutSize: 4,
    cols: 4,
    gutter: 20,
    gridW: 312,
    gridH: 250,
  }
  smallGridSettings = {
    gutter: 20,
    gridW: 250,
    gridH: 200,
  }
  @observable gridSettings = { ...this.defaultGridSettings }
  @observable viewingCollection = null
  @observable selectedCardIds = []
  @observable isLoading = false
  @observable movingCardIds = []
  @observable movingFromCollectionId = null
  @observable cardAction = 'move'
  defaultDialogProps = {
    open: null, // track whether "info" or "confirm" dialog are open, or none
    prompt: null,
    onConfirm: null,
    onCancel: null,
    iconName: null,
    confirmText: 'OK',
    cancelText: 'Cancel',
    onClose: () => this.closeDialog(),
  }
  @observable dialogConfig = { ...this.defaultDialogProps }
  @observable blurContent = false
  @observable orgCreated = false
  @observable searchText = ''
  @observable activityLogOpen = false

  @action popupAlert(props = {}) {
    _.assign(this.dialogConfig, {
      ...this.defaultDialogProps,
      iconName: 'Alert',
      open: 'info',
      ...props
    })
  }

  alert(message, iconName = 'Alert') {
    this.popupAlert({
      prompt: message,
      iconName,
    })
  }

  // same as above but defaults to OK checkmark
  alertOk(message) {
    this.popupAlert({
      prompt: message,
      iconName: 'Ok',
    })
  }

  defaultAlertError() {
    this.alert('There was an error performing this action.')
  }

  @action confirm(props = {}) {
    _.assign(this.dialogConfig, {
      ...this.defaultDialogProps,
      open: 'confirm',
      ...props
    })
  }

  @action closeDialog() {
    this.dialogConfig.open = null
  }

  // default action for updating any basic UiStore value
  @action update(name, value) {
    this[name] = value
  }

  @action closeRolesMenu() {
    this.rolesMenuOpen = false
  }

  @action openMoveMenu({ from: fromCollectionId, cardAction }) {
    this.openCardMenuId = false
    // On move, copy over selected cards to moving cards
    this.movingFromCollectionId = fromCollectionId
    // cardAction can be 'move' or 'link'
    this.cardAction = cardAction || 'move'
    this.movingCardIds.replace([...this.selectedCardIds])
  }

  @action closeMoveMenu() {
    this.movingCardIds.replace([])
    this.movingFromCollectionId = null
    this.deselectCards()
  }

  @computed get isMovingCards() {
    return this.movingCardIds.length && this.cardAction === 'move'
  }

  // NOTE: because we aren't tracking a difference between "closed" and null,
  // OrgMenu will always default back to "People & Groups" while in the process of closing/fading
  @computed get organizationMenuOpen() {
    return !!this.organizationMenuPage
  }

  // --- grid properties
  @computed get gridMaxW() {
    const grid = this.gridSettings
    return (grid.gridW * grid.cols) + (grid.gutter * (grid.cols - 1))
  }

  gridWidthFor(virtualCols) {
    let cols = virtualCols
    let { gridW, gutter } = this.defaultGridSettings
    if (virtualCols === 3) {
      ({ gridW, gutter } = this.smallGridSettings)
      // the "3 col" layout is used as a breakpoint, however it actually renders with 4 cols
      cols = 4
    }
    return (gridW * cols) + (gutter * (cols - 1))
  }

  gridHeightFor(cols, { useDefault = false } = {}) {
    const { gridH, gutter } = useDefault ? this.defaultGridSettings : this.gridSettings
    return (gridH * cols) + gutter
  }

  @action updateColumnsToFit(windowWidth) {
    let cols = null
    // shortcut for 4,3,2,1
    _.each(_.range(4, 0), numCols => {
      if (!cols && windowWidth > this.gridWidthFor(numCols)) {
        cols = numCols
        return false
      }
      return true
    })

    let update = {
      ...this.defaultGridSettings,
      cols,
      layoutSize: cols,
    }
    if (cols === 3) {
      update = {
        ...this.smallGridSettings,
        cols: 4,
        layoutSize: cols,
      }
    }

    // finally, apply changes if they have changed
    if (this.layoutSize !== this.gridSettings.layoutSize) {
      _.assign(this.gridSettings, update)
    }
  }
  // --- grid properties />

  // --- BCT + GridCard properties
  @action openBlankContentTool(options = {}) {
    this.deselectCards()
    this.openCardMenuId = false
    this.blankContentToolState = {
      ...this.defaultBCTState,
      order: 0,
      width: 1,
      height: 1,
      emptyCollection: this.viewingCollection && this.viewingCollection.isEmpty,
      ...options
    }
  }

  @computed get blankContentToolIsOpen() {
    return this.blankContentToolState.order !== null
  }

  @action resetSelectionAndBCT() {
    this.deselectCards()
    this.closeBlankContentTool()
  }

  @action closeBlankContentTool() {
    this.blankContentToolState = { ...this.defaultBCTState }
  }

  @action setViewingCollection(collection = null) {
    // called when loading a new CollectionPage
    this.viewingCollection = collection
    this.deselectCards()
  }

  @action toggleSelectedCardId(cardId) {
    if (this.isSelected(cardId)) {
      this.selectedCardIds.remove(cardId)
    } else {
      this.selectedCardIds.push(cardId)
    }
  }

  // For certain actions we want to force a toggle on
  @action selectCardId(cardId) {
    if (!this.isSelected(cardId)) {
      this.selectedCardIds.push(cardId)
    }
  }

  @computed get collectionCardIds() {
    return this.viewingCollection.cardIds
  }

  @action deselectCards() {
    this.selectedCardIds.replace([])
  }

  // TODO: add a unit test for this
  @action selectCardsUpTo(cardId) {
    const selected = [...this.selectedCardIds]
    const cardIds = [...this.collectionCardIds]
    const lastSelected = _.last(selected)
    // gather which cardIds are between this card and the last selected card
    let between = []
    if (lastSelected) {
      if (lastSelected === cardId) return
      const lastIdx = this.collectionCardIds.findIndex(id => id === lastSelected)
      const thisIdx = this.collectionCardIds.findIndex(id => id === cardId)
      if (lastIdx > thisIdx) {
        between = cardIds.slice(thisIdx, lastIdx)
      } else {
        between = cardIds.slice(lastIdx, thisIdx)
      }
      // get unique cardIds selected, make sure the current card is put at the end w/ reverse
      let newSelected = _.reverse(_.uniq(_.concat([cardId], selected, between)))
      // if ALL those items were already selected, then toggle selection to OFF
      if (_.isEmpty(_.difference(newSelected, selected))) {
        newSelected = _.difference(selected, between)
      }
      this.selectedCardIds.replace(newSelected)
    } else {
      this.selectedCardIds.replace([cardId])
    }
  }

  isSelected(cardId) {
    if (this.selectedCardIds.length === 0) return false
    return this.selectedCardIds.findIndex(id => id === cardId) > -1
  }
  // --- BCT + GridCard properties />
}
