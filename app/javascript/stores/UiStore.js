import _ from 'lodash'
import { animateScroll } from 'react-scroll'
import { observable, action, runInAction, computed } from 'mobx'
import sleep from '~/utils/sleep'
import v from '~/utils/variables'

export default class UiStore {
  // store this for usage by other components
  scroll = animateScroll
  defaultBCTState = {
    order: null,
    width: null,
    height: null,
    row: null,
    col: null,
    replacingId: null,
    emptyCollection: false,
    collectionId: null,
    blankType: null,
  }
  defaultCardMenuState = {
    id: null,
    x: 0,
    y: 0,
    direction: 'left',
  }
  @observable
  pageError = null
  @observable
  blankContentToolState = { ...this.defaultBCTState }
  @observable
  cardMenuOpen = { ...this.defaultCardMenuState }
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
    // eslint-disable-next-line
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
    gutter: 14,
    gridW: 316,
    gridH: 250,
  }
  smallGridSettings = {
    gutter: 14,
    gridW: 253,
    gridH: 200,
  }
  @observable
  gridSettings = { ...this.defaultGridSettings }
  @observable
  viewingCollection = null
  @observable
  previousViewingCollection = null
  @observable
  viewingItem = null
  @observable
  selectedCardIds = []
  @observable
  isLoading = false
  @observable
  dismissedMoveHelper = false
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
    closeable: true,
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
  overdueBannerVisible = true
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
  @observable
  actionAfterRoute = null
  @observable
  movingIntoCollection = null
  @observable
  dragTargets = []
  @observable
  activeDragTarget = null
  @observable
  multiMoveCardIds = []
  @observable
  modalContentRef = null
  @observable
  dragCardMaster = null
  @observable
  selectedArea = { minX: null, maxX: null, minY: null, maxY: null }
  @observable
  selectedAreaEnabled = false

  @action
  toggleEditingCardId(cardId) {
    if (this.editingCardId === cardId) {
      this.editingCardId = null
    } else {
      this.editingCardId = cardId
    }
  }

  @action
  startDragging(cardId) {
    this.dragging = true
    if (
      this.selectedCardIds.length > 0 &&
      this.selectedCardIds.indexOf(cardId.toString()) > -1
    ) {
      this.multiMoveCardIds = [...this.selectedCardIds]
    } else {
      this.multiMoveCardIds = [cardId]
    }
    this.dragCardMaster = cardId
  }

  @action
  stopDragging() {
    this.dragging = false
    this.activeDragTarget = null
    this.dragCardMaster = null
  }

  @action
  addDragTarget(item, coordinates, componentType) {
    const existingTarget = this.dragTargets.find(
      target => target.item.identifier === item.identifier
    )
    if (existingTarget) return
    this.dragTargets.push({ item, coordinates, componentType })
  }

  removeDragTarget(item, coordinates, componentType) {
    _.remove(
      this.dragTargets,
      target => target.item.identifier === item.identifier
    )
  }

  @action
  drag(coordinates) {
    const anyTarget = this.dragTargetsOverlap(coordinates)
    this.activeDragTarget = anyTarget
  }

  dragTargetsOverlap(dragCoordinates) {
    const { x, y } = dragCoordinates

    return this.dragTargets.find(target => {
      const overlap =
        x < target.coordinates.left ||
        x > target.coordinates.right ||
        y > target.coordinates.bottom ||
        y < target.coordinates.top
      return !overlap
    })
  }

  @action
  setSelectedArea(selectedArea) {
    this.selectedArea = selectedArea
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
      prompt: message || 'Server Error',
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
  loadingDialog(props = {}) {
    _.assign(this.dialogConfig, {
      ...this.defaultDialogProps,
      open: 'loading',
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
    this.update('cardMenuOpen', { ...this.defaultCardMenuState })
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
    this.dismissedMoveHelper = false
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
    this.dismissedMoveHelper = false
    this.templateName = ''
    this.movingCardIds.replace([])
    this.movingFromCollectionId = null
    if (deselect) this.deselectCards()
  }

  @action
  setMovingCards(ids, { cardAction } = {}) {
    this.movingCardIds.replace(ids)
    this.cardAction = cardAction
  }

  @computed
  get isMovingCards() {
    return this.movingCardIds.length && this.cardAction === 'move'
  }

  @computed
  get shouldOpenMoveModal() {
    return (
      this.movingCardIds.length > 0 &&
      this.cardAction !== 'moveWithinCollection'
    )
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
    if (!cols) cols = 1

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
      emptyCollection:
        viewingCollection &&
        viewingCollection.isEmpty &&
        !viewingCollection.isBoard,
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
  closeBlankContentTool({ force = false } = {}) {
    const { viewingCollection } = this
    if (!force && viewingCollection && viewingCollection.isEmpty) {
      // shouldn't be allowed to close BCT on empty collection, send back to default
      // -- also helps with the setup of SubmissionBox where you can close the bottom BCT
      this.openBlankContentTool()
    } else {
      this.blankContentToolState = { ...this.defaultBCTState }
    }
  }

  @action
  setViewingCollection(collection = null) {
    // escape if we're already viewing this collection
    if (
      this.viewingCollection &&
      collection &&
      this.viewingCollection.id === collection.id
    )
      return
    this.previousViewingCollection = this.viewingCollection
    this.viewingCollection = collection
    this.viewingItem = null
    this.deselectCards()
  }

  @action
  setViewingItem(item = null) {
    // escape if we're already viewing this item
    if (this.viewingItem && item && this.viewingItem.id === item.id) return
    this.previousViewingCollection = this.viewingCollection
    this.viewingCollection = null
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
  openOptionalMenus(opts = {}) {
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
    const lastSelectedCardId = _.last(selected)

    if (!lastSelectedCardId) return this.selectedCardIds.replace([cardId])
    if (lastSelectedCardId === cardId) return this.selectedCardIds

    // Get cardIds that are between this card and the last selected card
    const cardIdsBetween = this.viewingCollection.cardIdsBetween(
      cardId,
      lastSelectedCardId
    )

    // Get unique cardIds selected
    // Make sure the current card is put at the end w/ reverse
    let newSelected = _.reverse(
      _.uniq(_.concat([cardId], selected, cardIdsBetween))
    )

    // If ALL those items were already selected,
    // toggle selection to OFF
    if (_.isEmpty(_.difference(newSelected, selected))) {
      newSelected = _.difference(selected, cardIdsBetween)
    }

    return this.selectedCardIds.replace(newSelected)
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
  hideOverdueBanner() {
    this.overdueBannerVisible = false
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

  @action
  performActionAfterRoute() {
    if (!_.isFunction(this.actionAfterRoute)) return
    this.actionAfterRoute()
    this.actionAfterRoute = null
  }

  scrollToBottomOfModal() {
    if (!this.modalContentRef) return
    const node = this.modalContentRef.current
    node.scrollTop = node.scrollHeight
  }

  scrollToTop() {
    this.scroll.scrollToTop()
  }

  scrollToBottom() {
    if (this.viewingCollection && this.viewingCollection.isBoard) {
      this.scroll.scrollTo(
        this.viewingCollection.scrollBottom - window.innerHeight / 3
      )
      return
    }
    this.scroll.scrollToBottom()
  }
}
