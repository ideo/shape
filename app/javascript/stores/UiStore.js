import _ from 'lodash'
import { animateScroll } from 'react-scroll'
import { observable, action, runInAction, computed } from 'mobx'
import queryString from 'query-string'
import sleep from '~/utils/sleep'
import { setScrollHeight } from '~/utils/scrolling'
import v from '~/utils/variables'

export default class UiStore {
  // store this for usage by other components
  scroll = animateScroll
  defaultBCTState = {
    order: null,
    width: null,
    height: null,
    replacingId: null,
    emptyCollection: false,
    collectionId: null,
    blankType: null,
  }
  @observable
  blankContentToolState = { ...this.defaultBCTState }
  @observable
  cardMenuOpen = { id: false, x: 0, y: 0, direction: 'left' }
  @computed
  get cardMenuOpenAndPositioned() {
    const { cardMenuOpen } = this
    return cardMenuOpen.id && !!(cardMenuOpen.x || cardMenuOpen.y)
  }
  @observable
  organizationMenuPage = null
  @observable
  organizationMenuGroupId = null
  @observable
  rolesMenuOpen = null
  @observable
  isTouchDevice =
    // https://hacks.mozilla.org/2013/04/detecting-touch-its-the-why-not-the-how/
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  @observable
  pageMenuOpen = false
  @observable
  tagsModalOpenId = null
  @observable
  submissionBoxSettingsOpen = null
  @observable
  loadedSubmissions = false
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
  @observable
  gridSettings = { ...this.defaultGridSettings }
  @observable
  viewingCollection = null
  @observable
  previousViewingCollection = null
  @observable
  previousCollectionScrollHeight = 0
  @observable
  viewingItem = null
  @observable
  selectedCardIds = []
  @observable
  isLoading = false
  @observable
  movingCardIds = []
  @observable
  movingFromCollectionId = null
  @observable
  cardAction = 'move'
  @observable
  templateName = ''
  defaultDialogProps = {
    open: null, // track whether "info" or "confirm" dialog are open, or none
    prompt: null,
    onConfirm: null,
    onCancel: null,
    iconName: null,
    confirmText: 'OK',
    cancelText: 'Cancel',
    fadeOutTime: undefined,
    snoozeChecked: false,
    onToggleSnoozeDialog: null,
    image: null,
    options: [],
    onClose: () => this.closeDialog(),
  }
  defaultSnackbarProps = {
    open: false,
    message: '',
    autoHideDuration: 4000,
    onClose: () => this.closeSnackbar(),
  }
  @observable
  dialogConfig = { ...this.defaultDialogProps }
  @observable
  snackbarConfig = { ...this.defaultSnackbarProps }
  @observable
  blurContent = false
  @observable
  orgCreated = false
  @observable
  searchText = ''
  @observable
  activityLogOpen = false
  @observable
  activityLogForceWidth = null
  @observable
  activityLogPosition = { x: 0, y: 0, w: 1, h: 1 }
  @observable
  activityLogPage = null
  @observable
  activityLogMoving = false
  @observable
  windowWidth = 0

  // Comments + Threads
  @observable
  commentsOpen = false
  // marked by thread.key (so it works for new records as well)
  @observable
  expandedThreadKey = null
  @observable
  editingName = false
  @observable
  trackedRecords = new Map()
  @observable
  dragging = false
  @observable
  textEditingItem = null
  @observable
  editingCardId = null
  @observable
  collectionCardSortOrder = 'updated_at'
  @observable
  launchButtonLoading = false
  @observable
  newCards = []
  @observable
  autocompleteValues = 0

  @action
  toggleEditingCardId(cardId) {
    if (this.editingCardId === cardId) {
      this.editingCardId = null
    } else {
      this.editingCardId = cardId
    }
  }

  @action
  startDragging() {
    this.dragging = true
  }

  @action
  stopDragging() {
    this.dragging = false
  }

  @action
  popupAlert(props = {}) {
    _.assign(this.dialogConfig, {
      ...this.defaultDialogProps,
      iconName: 'Alert',
      open: 'info',
      ...props,
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

  @action
  confirm(props = {}) {
    _.assign(this.dialogConfig, {
      ...this.defaultDialogProps,
      open: 'confirm',
      ...props,
    })
  }

  @action
  setSnoozeChecked(val) {
    this.dialogConfig.snoozeChecked = val
  }

  @action
  closeDialog() {
    this.dialogConfig.open = null
  }

  openCardMenu(id, opts = {}) {
    const { x = 0, y = 0, direction = 'left' } = opts
    this.update('cardMenuOpen', { id, x, y, direction })
  }

  closeCardMenu() {
    this.update('cardMenuOpen', { id: false, x: 0, y: 0, direction: 'left' })
  }

  async popupSnackbar(props = {}) {
    if (this.snackbarConfig.open) {
      this.closeSnackbar()
      // pause slightly between closing last snackbar and opening a new one
      await sleep(350)
    }
    runInAction(() => {
      _.assign(this.snackbarConfig, {
        ...this.defaultSnackbarProps,
        open: true,
        ...props,
      })
    })
  }

  @action
  closeSnackbar() {
    _.assign(this.snackbarConfig, {
      ...this.defaultSnackbarProps,
    })
  }

  // default action for updating any basic UiStore value
  @action
  update(name, value) {
    this[name] = value
  }

  @action
  closeRolesMenu() {
    this.rolesMenuOpen = null
  }

  @action
  openMoveMenu({ from: fromCollectionId, cardAction }) {
    this.pageMenuOpen = false
    this.closeCardMenu()
    // On move, copy over selected cards to moving cards
    this.movingFromCollectionId = fromCollectionId
    // cardAction can be 'move' or 'link'
    this.cardAction = cardAction || 'move'
    if (this.cardAction === 'useTemplate') {
      // fake the selected card to trigger the menu open,
      // because we aren't really moving an existing card
      this.movingCardIds.replace(['template'])
      // store the name e.g. "CoLab Prototype in transit"
      this.templateName = this.viewingCollection.name
    } else {
      this.movingCardIds.replace([...this.selectedCardIds])
      this.templateName = ''
    }
  }

  @action
  closeMoveMenu({ deselect = true } = {}) {
    this.templateName = ''
    this.movingCardIds.replace([])
    this.movingFromCollectionId = null
    if (deselect) this.deselectCards()
  }

  @computed
  get isMovingCards() {
    return this.movingCardIds.length && this.cardAction === 'move'
  }

  // NOTE: because we aren't tracking a difference between "closed" and null,
  // OrgMenu will always default back to "People & Groups" while in the process of closing/fading
  @computed
  get organizationMenuOpen() {
    return !!this.organizationMenuPage
  }

  @action
  openOrgCreateModal() {
    this.organizationMenuPage = 'newOrganization'
  }

  @action
  openGroup(groupId) {
    this.organizationMenuPage = 'editRoles'
    this.organizationMenuGroupId = groupId
  }

  // --- grid properties
  @computed
  get gridMaxW() {
    const grid = this.gridSettings
    return grid.gridW * grid.cols + grid.gutter * (grid.cols - 1)
  }

  @action
  updateActivityLogWidth(width) {
    if (width <= v.responsive.smallBreakpoint) {
      this.activityLogForceWidth = width
    } else {
      this.activityLogForceWidth = null
    }
  }

  gridWidthFor(virtualCols) {
    let cols = virtualCols
    let { gridW, gutter } = this.defaultGridSettings
    if (virtualCols === 3) {
      ;({ gridW, gutter } = this.smallGridSettings)
      // the "3 col" layout is used as a breakpoint, however it actually renders with 4 cols
      cols = 4
    }
    return gridW * cols + gutter * (cols - 1)
  }

  gridHeightFor(cols, { useDefault = false } = {}) {
    const { gridH, gutter } = useDefault
      ? this.defaultGridSettings
      : this.gridSettings
    return gridH * cols + gutter
  }

  @action
  updateColumnsToFit(windowWidth) {
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
  @action
  openBlankContentTool(options = {}) {
    const { viewingCollection } = this
    this.deselectCards()
    this.closeCardMenu(false)
    this.blankContentToolState = {
      ...this.defaultBCTState,
      order: 0,
      width: 1,
      height: 1,
      emptyCollection: viewingCollection && viewingCollection.isEmpty,
      collectionId: viewingCollection && viewingCollection.id,
      ...options,
    }
  }

  @computed
  get blankContentToolIsOpen() {
    return this.blankContentToolState.order !== null
  }

  @computed
  get cancelUndo() {
    // certain UI states should prevent CTRL+Z from triggering an undo
    return this.organizationMenuOpen || this.dialogConfig.open
  }

  @action
  resetSelectionAndBCT() {
    this.deselectCards()
    this.closeBlankContentTool()
  }

  @action
  closeBlankContentTool() {
    const { viewingCollection } = this
    if (viewingCollection && viewingCollection.isEmpty) {
      // shouldn't be allowed to close BCT on empty collection, send back to default
      // -- also helps with the setup of SubmissionBox where you can close the bottom BCT
      this.openBlankContentTool()
    } else {
      this.blankContentToolState = { ...this.defaultBCTState }
    }
  }

  @action
  setViewingCollection(collection = null) {
    // called when loading a new CollectionPage
    if (
      collection &&
      this.previousViewingCollection &&
      collection.id === this.previousViewingCollection.id
    ) {
      setScrollHeight(this.previousCollectionScrollHeight)
    }
    this.previousViewingCollection = this.viewingCollection
    this.viewingCollection = collection
    this.deselectCards()
  }

  @action
  setViewingItem(item = null) {
    this.previousViewingCollection = this.viewingCollection
    this.viewingItem = item
  }

  get viewingRecord() {
    // only one should be present at a time depending on what page you're on
    return this.viewingCollection || this.viewingItem
  }

  @action
  toggleSelectedCardId(cardId) {
    if (this.isSelected(cardId)) {
      this.selectedCardIds.remove(cardId)
    } else {
      this.selectedCardIds.push(cardId)
    }
  }

  // For certain actions we want to force a toggle on
  @action
  selectCardId(cardId) {
    if (!this.isSelected(cardId)) {
      this.selectedCardIds.push(cardId)
    }
  }

  @action
  reselectCardIds(cardIds) {
    this.selectedCardIds.replace(cardIds)
  }

  @computed
  get collectionCardIds() {
    return this.viewingCollection.cardIds
  }

  @action
  deselectCards() {
    this.selectedCardIds.replace([])
  }

  @action
  openOptionalMenus(params) {
    const opts = queryString.parse(params)
    if (opts) {
      if (opts.open) {
        this.activityLogPage = opts.open
        this.activityLogOpen = true
      }
      if (opts.testing_completed) {
        this.alert(
          'No ideas are ready to test yet. Please come back later.',
          'Clock'
        )
      }
    }
    return opts.open
  }

  // takes a click event as a parameter
  captureKeyboardGridClick = (e, cardId) => {
    const ctrlClick = e.metaKey || e.ctrlKey
    const shiftClick = e.shiftKey
    if (ctrlClick || shiftClick) {
      if (ctrlClick) {
        // individually select
        this.toggleSelectedCardId(cardId)
      }
      if (shiftClick) {
        // select everything between
        this.selectCardsUpTo(cardId)
      }
      return true
    }
    return false
  }

  // TODO: add a unit test for this
  @action
  selectCardsUpTo(cardId) {
    const selected = [...this.selectedCardIds]
    const cardIds = [...this.collectionCardIds]
    const lastSelected = _.last(selected)
    // gather which cardIds are between this card and the last selected card
    let between = []
    if (lastSelected) {
      if (lastSelected === cardId) return
      const lastIdx = this.collectionCardIds.findIndex(
        id => id === lastSelected
      )
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

  @action
  expandThread(key, { reset = false } = {}) {
    if (key) {
      // when we expand a thread we also want it to set the ActivityLog to Comments
      this.update('activityLogPage', 'comments')
      // reset it first, that way if it's expanded offscreen, it will get re-opened/scrolled to
      if (reset) this.expandedThreadKey = null
    }
    this.expandedThreadKey = key
  }

  // after performing an action (event), track following the record for notifications
  trackEvent(event, record) {
    this.trackRecord(record.identifier)
    if (record.internalType === 'items' && record.parent) {
      this.trackRecord(record.parent.identifier)
    }
  }

  @action
  trackRecord(identifier) {
    const TIMEOUT = 15 * 1000 * 50
    if (this.trackedRecords.has(identifier)) {
      clearTimeout(this.trackedRecords.get(identifier))
    }
    this.trackedRecords.set(
      identifier,
      setTimeout(() => {
        this.trackedRecords[identifier] = null
      }, TIMEOUT)
    )
  }

  @action
  addNewCard(id) {
    if (!this.isNewCard(id)) {
      this.newCards.push(id)
    }
  }

  @action
  removeNewCard(id) {
    const index = this.newCards.indexOf(id)
    if (index === -1) {
      return
    }
    this.newCards.splice(index, 1)
  }

  isNewCard(id) {
    return this.newCards.indexOf(id) !== -1
  }

  @action
  autocompleteMenuClosed() {
    this.autocompleteValues = 0
  }
}
