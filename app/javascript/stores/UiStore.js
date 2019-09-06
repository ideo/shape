import _ from 'lodash'
import { animateScroll } from 'react-scroll'
import { observable, action, runInAction, computed } from 'mobx'

import routeToLogin from '~/utils/routeToLogin'
import sleep from '~/utils/sleep'
import v from '~/utils/variables'
import { POPUP_ACTION_TYPES, ACTION_SOURCES } from '~/enums/actionEnums'

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
    offsetX: 0,
    offsetY: 0,
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
  isCypress = navigator && navigator.userAgent === 'cypress'
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
  @observable
  adminUsersMenuOpen = null
  @observable
  adminAudienceMenuOpen = null
  @observable
  feedbackAudienceMenuOpen = null
  @observable
  gridSettings = { ...v.defaultGridSettings }
  @observable
  previousViewingRecord = null
  @observable
  viewingRecord = null
  @observable
  selectedCardIds = []
  @observable
  isLoading = false
  @observable
  isLoadingMoveAction = false
  @observable
  dismissedMoveHelper = false
  @observable
  movingCardIds = []
  @observable
  movingFromCollectionId = null
  @observable
  cardAction = 'move'
  @observable
  pastingCards = false
  @observable
  templateName = ''
  defaultDialogProps = {
    open: null, // track whether "info" or "confirm" dialog are open, or none
    prompt: null,
    subPromptNode: null,
    onConfirm: null,
    onCancel: null,
    iconName: null,
    confirmImage: null,
    confirmText: 'OK',
    confirmPrompt: null,
    cancelImage: null,
    cancelText: 'Cancel',
    cancelPrompt: null,
    closeable: true,
    fadeOutTime: undefined,
    snoozeChecked: false,
    onToggleSnoozeDialog: null,
    backgroundColor: v.colors.commonDark,
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
  @observable
  emptySpaceClickHandlers = new Set()

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
  @observable
  linkedBreadcrumbTrail = []
  @observable
  linkedInMyCollection = false
  @observable
  editingCardCover = null

  @action
  toggleEditingCardId(cardId) {
    if (this.editingCardId === cardId) {
      this.editingCardId = null
    } else {
      this.editingCardId = cardId
    }
  }

  @action
  setEditingCardCover(editingCardCoverId) {
    this.editingCardCover = editingCardCoverId
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
  performPopupAction(message, actionType) {
    switch (actionType) {
      case POPUP_ACTION_TYPES.ALERT:
        this.popupAlert({ prompt: message, fadeOutTime: 6000 })
        return
      case POPUP_ACTION_TYPES.SNACKBAR:
      default:
        this.popupSnackbar({ message })
        return
    }
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

  @action
  openCardMenu(id, opts = {}) {
    const { x = 0, y = 0, offsetX = 0, offsetY = 0 } = opts
    this.update('cardMenuOpen', {
      id,
      x,
      y,
      offsetX,
      offsetY,
    })
    if (this.selectedCardIds.length && this.selectedCardIds.indexOf(id) < 0) {
      // deselect all cards when card menu is opened on a non-selected card
      this.selectedCardIds.replace([])
    }
  }

  closeCardMenu() {
    this.update('cardMenuOpen', { ...this.defaultCardMenuState })
  }

  // TODO: rename this function to be clear it is show or reroute??
  showPermissionsAlert() {
    const { viewingCollection } = this
    if (viewingCollection && viewingCollection.isPublicJoinable) {
      routeToLogin({ redirect: viewingCollection.frontend_url })
      return
    }
    this.alert('You need permission to access this content.', 'Key')
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
  openMoveMenu({ from, cardAction = 'move', context = null }) {
    const { id: fromCollectionId } = from
    this.dismissedMoveHelper = false
    this.pageMenuOpen = false
    this.closeCardMenu()
    // On move, copy over selected cards to moving cards
    this.movingFromCollectionId = fromCollectionId
    // cardAction can be 'move', 'link', 'duplicate', 'useTemplate'
    this.cardAction = cardAction
    if (this.cardAction === 'useTemplate') {
      const fromCover = context === ACTION_SOURCES.COVER
      if (fromCover) {
        const { parent_collection_card, name } = from
        const { id } = parent_collection_card
        // selected card is the card whose cover was selected
        this.movingCardIds.replace([id])
        this.templateName = name
      } else {
        const { name, parent_collection_card } = this.viewingCollection
        // fake the selected card to trigger the menu open,
        // because we aren't really moving an existing card
        this.movingCardIds.replace([parent_collection_card.id])
        // store the name e.g. "CoLab Prototype in transit"
        this.templateName = name
      }
    } else {
      this.movingCardIds.replace([...this.selectedCardIds])
      this.deselectCards()
      this.templateName = ''
    }
  }

  @action
  closeMoveMenu({ deselect = true } = {}) {
    this.dismissedMoveHelper = false
    this.templateName = ''
    this.isLoadingMoveAction = false
    this.cardAction = 'move'
    this.movingCardIds.replace([])
    this.movingFromCollectionId = null
    if (deselect) this.deselectCards()
  }

  @action
  addEmptySpaceClickHandler(handler) {
    this.emptySpaceClickHandlers.add(handler)
  }

  @action
  removeEmptySpaceClickHandler(handler) {
    this.emptySpaceClickHandlers.delete(handler)
  }

  @action
  clearEmptySpaceClickHandlers() {
    this.emptySpaceClickHandlers.clear()
  }

  @action
  onEmptySpaceClick(ev) {
    const { emptySpaceClickHandlers } = this
    if (emptySpaceClickHandlers.size === 0) return
    emptySpaceClickHandlers.forEach(handler => handler(ev))
  }

  @action
  setMovingCards(ids) {
    this.movingCardIds.replace(ids)
  }

  @computed
  get isMovingCards() {
    return !!(this.movingCardIds.length && this.cardAction === 'move')
  }

  @computed
  get shouldOpenMoveModal() {
    return this.movingCardIds.length > 0 && !this.movingIntoCollection
  }

  @computed
  get isMobileXs() {
    return this.windowWidth && this.windowWidth < v.responsive.smallBreakpoint
  }

  @computed
  get isMobile() {
    return this.windowWidth && this.windowWidth < v.responsive.medBreakpoint
  }

  @computed
  get isLargeBreakpoint() {
    return this.windowWidth && this.windowWidth >= v.responsive.largeBreakpoint
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
    let { gridW, gutter } = v.defaultGridSettings
    if (virtualCols === 3) {
      ;({ gridW, gutter } = v.smallGridSettings)
      // the "3 col" layout is used as a breakpoint, however it actually renders with 4 cols
      cols = 4
    }
    return gridW * cols + gutter * (cols - 1)
  }

  gridHeightFor(cols, { useDefault = false } = {}) {
    const { gridH, gutter } = useDefault
      ? v.defaultGridSettings
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
      ...v.defaultGridSettings,
      cols,
      layoutSize: cols,
    }
    if (cols === 3) {
      update = {
        ...v.smallGridSettings,
        cols: 4,
        layoutSize: cols,
      }
    }

    // finally, apply changes if they have changed
    if (this.layoutSize !== this.gridSettings.layoutSize) {
      _.assign(this.gridSettings, update)
    }
  }

  get isSmallGrid() {
    return this.gridSettings.layoutSize === 3
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

  @computed
  get cancelRedo() {
    // certain UI states should prevent CTRL+Shift+Z from triggering an undo
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
  setViewingRecord(record = null) {
    // escape if we're already viewing this collection
    if (
      this.viewingRecord &&
      record &&
      this.viewingRecord.id === record.id &&
      this.viewingRecord.internalType == record.internalType
    )
      return
    if (this.viewingRecord) this.previousViewingRecord = this.viewingRecord
    this.viewingRecord = record
    this.deselectCards()
  }

  @computed
  get viewingCollection() {
    return this.viewingRecord &&
      this.viewingRecord.internalType === 'collections'
      ? this.viewingRecord
      : null
  }

  @computed
  get viewingItem() {
    return this.viewingRecord && this.viewingRecord.internalType === 'items'
      ? this.viewingRecord
      : null
  }

  get isViewingHomepage() {
    return (
      this.viewingCollection &&
      this.viewingCollection.class_type === 'Collection::UserCollection'
    )
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
    this.reselectCardIds(
      // always put the newly selected card at the end
      _.reject(this.selectedCardIds, i => i === cardId).concat(cardId)
    )
  }

  @action
  reselectCardIds(cardIds) {
    this.selectedCardIds.replace(cardIds)
  }

  @action
  async selectAll({ location, card = null } = {}) {
    const { viewingCollection } = this
    let collection = viewingCollection
    if (!viewingCollection) return false
    if (
      viewingCollection.isSubmissionBox &&
      (location !== 'GridCard' || (card && card.parent !== viewingCollection))
    ) {
      // if we're viewing a submission box and we did not specifically click a card in the submission box itself
      // select the submissions instead
      collection = viewingCollection.submissions_collection
    }
    let all_collection_card_ids = _.map(collection.collection_cards, 'id')
    this.reselectCardIds(all_collection_card_ids)
    try {
      const res = await collection.API_fetchAllCardIds()
      all_collection_card_ids = res.data
      this.reselectCardIds(all_collection_card_ids)
      // if the user had already initiated a move action, move the newly selected cards into the move action
      if (this.movingCardIds.length) {
        runInAction(() => {
          this.movingCardIds.replace([...this.selectedCardIds])
        })
      }
    } catch (e) {
      console.warn(e)
    }
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
      } else if (opts.manage_group_id) {
        // /shape.space/ideo?manage_group_id=123`
        this.organizationMenuPage = 'editRoles'
        this.organizationMenuGroupId = opts.manage_group_id
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

  scrollToPosition(position) {
    this.scroll.scrollTo(position)
  }

  @action
  updateLinkedBreadcrumbTrail = ({
    breadcrumb,
    inMyCollection,
    record,
  } = {}) => {
    const { id, name, can_edit } = record
    // append the record being linked to
    const linkCrumb = {
      id,
      name,
      can_edit,
      inMyCollection,
      type: record.internalType,
      link: true,
    }
    this.linkedBreadcrumbTrail = this.linkedBreadcrumbTrail.concat(
      breadcrumb.concat(linkCrumb)
    )
  }

  @action
  linkedBreadcrumbTrailForRecord(record) {
    const { breadcrumb } = record
    const { linkedBreadcrumbTrail } = this

    if (!linkedBreadcrumbTrail.length || !breadcrumb) return breadcrumb
    const linkCrumb = _.last(linkedBreadcrumbTrail)
    const foundIdx = _.findIndex(breadcrumb, { id: linkCrumb.id })

    if (foundIdx !== -1) {
      if (linkCrumb.inMyCollection) {
        this.linkedInMyCollection = true
      }
      return _.uniqBy(
        linkedBreadcrumbTrail.concat(breadcrumb.slice(foundIdx + 1)),
        'id'
      )
    } else {
      // does this reset belong here? i.e. linkedBreadcrumbTrail has no proper connection here
      this.linkedBreadcrumbTrail.replace([])
      return breadcrumb
    }
  }

  @action
  restoreBreadcrumb(item) {
    // NOTE: this will restore the entire breadcrumb not just the spot you clicked
    // (e.g. if there were two different links in the trail)
    this.linkedBreadcrumbTrail.replace([])
    this.linkedInMyCollection = false
  }

  @action
  closeAdminUsersMenu() {
    this.adminUsersMenuOpen = null
  }
}
