import _ from 'lodash'
import { scroller, animateScroll } from 'react-scroll'
import { observable, action, runInAction, computed } from 'mobx'
import isTouchDevice from 'is-touch-device'
import localStorage from 'mobx-localstorage'

import sleep from '~/utils/sleep'
import v, {
  TOUCH_DEVICE_OS,
  EVENT_SOURCE_TYPES,
  FOAMCORE_MAX_ZOOM,
  FOAMCORE_INTERACTION_LAYER,
  ACTIVITY_LOG_PAGE_KEY,
  COLLECTION_CHANNEL_NAME,
} from '~/utils/variables'
import { POPUP_ACTION_TYPES } from '~/enums/actionEnums'
import { calculatePopoutMenuOffset } from '~/utils/clickUtils'
import { getTouchDeviceOS } from '~/utils/detectOperatingSystem'
import { calculatePageMargins } from '~/utils/pageUtils'
import ChannelManager from '~/utils/ChannelManager'
import { objectsEqual } from '~/utils/objectUtils'

const MAX_COLS = 16
const MAX_COLS_MOBILE = 8

export default class UiStore {
  // store this for usage by other components
  scroll = animateScroll
  scroller = scroller
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
    placeholderCard: null,
    selectedContentType: null,
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
  blankContentType = null
  @observable
  cardMenuOpen = { ...this.defaultCardMenuState }
  defaultSelectedTextRange = {
    range: null,
    textContent: null,
    cardId: null,
    quillEditor: null,
  }
  @observable
  selectedTextRangeForCard = { ...this.defaultSelectedTextRange }
  // stored in case we ever need to reset the text
  quillSnapshot = {}
  @observable
  organizationMenuPage = null
  @observable
  organizationMenuGroupId = null
  @observable
  preselectUserTag = false
  @observable
  rolesMenuOpen = null
  @observable
  isCypress = navigator && navigator.userAgent === 'cypress'
  @observable
  pageMenuOpen = false
  @observable
  tagsModalOpenId = null
  @observable
  submissionBoxSettingsOpen = null
  @observable
  loadingSubmissions = false
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
  isRouting = false
  @observable
  isTransparentLoading = false
  @observable
  isLoadingMoveAction = false
  @observable
  dismissedMoveHelper = false
  @observable
  showTemplateHelperForCollection = null
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
  @observable
  droppingFilesCount = 0
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
    showRefresh: false,
    backgroundColor: v.colors.commonDark,
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
  activityLogPage = 'comments'
  @observable
  activityLogMoving = false
  @observable
  windowWidth = 0
  @observable
  emptySpaceClickHandlers = new Set()

  // Comments + Threads
  // marked by thread.key (so it works for new records as well)
  @observable
  expandedThreadKey = null
  @observable
  commentingOnRecord = null
  @observable
  editingName = []
  @observable
  trackedRecords = new Map()
  @observable
  dragging = false
  @observable
  draggingFromMDL = false
  dragGridSpot = observable.map({})
  @observable
  placeholderSpot = { ...v.placeholderDefaults }
  @observable
  // track if you are dragging/moving more cards than visible
  movingCardsOverflow = false
  @observable
  textEditingItem = null
  @observable
  textEditingItemHasTitleText = false
  @observable
  // have to track this e.g. if you are editing the original or link card (same item)
  textEditingCardId = null
  hotSwapQuillPosition = null
  @observable
  overdueBannerVisible = true
  @observable
  editingCardCover = null
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
  selectedArea = {
    minX: null,
    maxX: null,
    minY: null,
    maxY: null,
  }
  @observable
  selectedAreaShifted = false
  @observable
  selectedAreaEnabled = false
  @observable
  linkedBreadcrumbTrail = []
  @observable
  linkedInMyCollection = false
  @observable
  replyingToCommentId = null
  @observable
  commentThreadBottomVisible = null
  @observable
  shouldRenderFixedHeader = false
  hoveringOverDefaults = {
    order: null,
    direction: null,
    card: null,
    record: null,
    holdingOver: false,
  }
  @observable
  hoveringOver = {
    ...this.hoveringOverDefaults,
  }
  placeholderDefaults = {
    xPos: 0,
    yPos: 0,
    width: 0,
    height: 0,
    cardWidth: 1,
    cardHeight: 1,
  }
  @observable
  placeholderPosition = {
    ...this.placeholderDefaults,
  }
  @observable
  hoveringOverSection = null
  @observable
  zoomLevel = FOAMCORE_MAX_ZOOM
  @observable
  tempZoomLevel = FOAMCORE_MAX_ZOOM
  @observable
  collaboratorColors = new Map()
  @observable
  challengeSettingsOpen = false
  @observable
  zoomLevels = []
  @observable
  currentlyZooming = false
  @observable
  // track which rows are visible on the page
  visibleRows = {
    min: 0,
    max: 0,
    num: 0,
  }
  @observable
  addedNewRole = false
  @observable
  touchActionMenuOpenId = null

  get routingStore() {
    return this.apiStore.routingStore
  }

  get isTouchDevice() {
    // from airbnb/is-touch-device
    return isTouchDevice()
  }

  @action
  setEditingCardCover(editingCardCoverId) {
    this.editingCardCover = editingCardCoverId
  }

  @action
  startDragging(cardId) {
    this.dragging = true
    this.draggingFromMDL = false
    if (_.includes(cardId, '-mdlPlaceholder')) {
      this.draggingFromMDL = true
      this.multiMoveCardIds = [...this.movingCardIds]
    } else {
      if (
        this.selectedCardIds.length === 0 ||
        this.selectedCardIds.indexOf(cardId.toString()) === -1
      ) {
        // if the dragging card is not already selected, select it.
        // this will also pick up any cards inside the selected section
        this.reselectCardIds([cardId])
      }
      this.multiMoveCardIds = [...this.selectedCardIds]
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
  openTouchActionMenu(cardId) {
    this.touchActionMenuOpenId = cardId
    this.clearTextEditingCard()
  }

  @action
  closeTouchActionMenu() {
    this.touchActionMenuOpenId = null
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
  setSelectedArea(selectedArea, { shifted = false } = {}) {
    this.selectedArea = selectedArea
    this.selectedAreaShifted = shifted

    // ----
    const { viewingCollection } = this
    if (!viewingCollection || !viewingCollection.isBoard) {
      return
    }

    const { minX, minY, maxX, maxY } = selectedArea
    const rect = this.foamcoreBoundingRectangle
    const scrollTop = window.pageYOffset
    const scrollLeft = window.pageXOffset

    const top = rect.y + scrollTop
    const left = rect.x + scrollLeft

    const minRawCoords = {
      x: minX - left,
      y: minY - top,
    }
    const maxRawCoords = {
      x: maxX - left,
      y: maxY - top,
    }
    const minCoords = this.coordinatesForPosition(minRawCoords)
    const maxCoords = this.coordinatesForPosition(maxRawCoords)

    this.selectCardsWithinSelectedArea({
      minRow: minCoords.row,
      minCol: minCoords.col,
      maxRow: maxCoords.row,
      maxCol: maxCoords.col,
    })
  }

  @computed
  get hasSelectedArea() {
    const { minX, maxX } = this.selectedArea
    return minX && maxX && maxX > minX
  }

  @action
  resetSelectedArea() {
    this.selectedArea = {
      minX: null,
      maxX: null,
      minY: null,
      maxY: null,
    }
  }

  @action
  selectCardsWithinSelectedArea(minMaxCorners) {
    const { selectedCardIds, selectedAreaShifted, viewingCollection } = this
    // const viewingCardIds = viewingCollection.cardIds
    let newSelectedCardIds = []

    if (minMaxCorners.minRow === null || minMaxCorners.minCol === null) {
      // or select none??
      return
    }

    newSelectedCardIds = viewingCollection.cardIdsBetweenByColRow({
      minMaxCorners,
    })

    if (selectedAreaShifted) {
      newSelectedCardIds = _.union(newSelectedCardIds, selectedCardIds)
    }

    if (!_.isEqual(newSelectedCardIds, [...selectedCardIds])) {
      this.reselectCardIds(newSelectedCardIds)
    }
  }

  @action
  setEditingName(nameKey) {
    if (this.editingName.includes(nameKey)) return
    this.editingName.push(nameKey)
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

  @computed
  get cardMenuOpenAndPositioned() {
    const { cardMenuOpen } = this
    return cardMenuOpen.id && !!(cardMenuOpen.x || cardMenuOpen.y)
  }

  @action
  openContextMenu = (
    ev,
    { x = 0, y = 0, card = {}, menuItemCount = 1 } = {}
  ) => {
    let eventType = EVENT_SOURCE_TYPES.GRID_CARD
    let numberOfMenuItems = menuItemCount

    const targetingTextEditor = ev.target.closest('.ql-editor')
    if (targetingTextEditor && this.cardHasSelectedTextRange(card.id)) {
      eventType = EVENT_SOURCE_TYPES.TEXT_EDITOR
      numberOfMenuItems = 1 // or however many we end up with in TextActionMenu
    }

    // use util method to dynamically move the component on open
    const positionOffset = calculatePopoutMenuOffset(
      ev,
      eventType,
      numberOfMenuItems
    )
    const { offsetX, offsetY } = positionOffset

    this.update('cardMenuOpen', {
      id: card.id,
      x,
      y,
      offsetX,
      offsetY,
      menuType: eventType,
    })

    if (
      this.selectedCardIds.length &&
      this.selectedCardIds.indexOf(card.id) < 0
    ) {
      // deselect all cards when card menu is opened on a non-selected card
      this.deselectCards()
    }
  }

  closeCardMenu() {
    this.update('cardMenuOpen', { ...this.defaultCardMenuState })
  }

  actionMenuOpenForCard(id) {
    return (
      this.cardMenuOpen.id === id &&
      this.cardMenuOpen.menuType === EVENT_SOURCE_TYPES.GRID_CARD
    )
  }

  textMenuOpenForCard(id) {
    return (
      this.cardMenuOpen.id === id &&
      this.cardMenuOpen.menuType === EVENT_SOURCE_TYPES.TEXT_EDITOR
    )
  }

  // TODO: rename this function to be clear it is show or reroute??
  showPermissionsAlert() {
    const { viewingCollection, routingStore } = this
    if (viewingCollection && viewingCollection.isPublicJoinable) {
      routingStore.routeToLogin({ redirect: viewingCollection.frontendUrl })
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
  openMoveMenu({ from = null, cardAction = 'move' }) {
    const fromCollectionId = from ? from.id : null
    this.dismissedMoveHelper = false
    this.pageMenuOpen = false
    this.closeCardMenu()
    // On move, copy over selected cards to moving cards
    this.movingFromCollectionId = fromCollectionId
    // cardAction can be 'move', 'link', 'duplicate', 'useTemplate'
    this.cardAction = cardAction
    if (this.cardAction === 'useTemplate') {
      const { parent_collection_card, name } = from
      const { id } = parent_collection_card
      // selected card is the card whose cover was selected
      this.movingCardIds.replace([id])
      this.templateName = name
    } else {
      let firstCardId = _.first(this.selectedCardIds)
      if (from && this.selectedCardIds.length > 1) {
        // always put the topLeft card first
        firstCardId = from.firstCardId(this.selectedCardIds)
      }
      this.movingCardIds.replace(_.uniq([firstCardId, ...this.selectedCardIds]))
      this.deselectCards()
      this.templateName = ''
    }
  }

  @action
  closeMoveMenu({ deselect = true } = {}) {
    this.dismissedMoveHelper = false
    this.templateName = ''
    this.isLoadingMoveAction = false
    this.isTransparentLoading = false
    this.cardAction = 'move'
    this.movingCardIds.replace([])
    this.multiMoveCardIds.replace([])
    this.movingIntoCollection = null
    this.movingFromCollectionId = null
    this.showTemplateHelperForCollection = null
    this.draggingFromMDL = false
    this.setHoveringOver()
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

  @action
  setMovingIntoCollection(collection) {
    this.movingIntoCollection = collection
    this.isTransparentLoading = true
  }

  @computed
  get isMovingCards() {
    return !!(this.movingCardIds.length && this.cardAction === 'move')
  }

  @computed
  get shouldOpenMoveSnackbar() {
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

  get isIE() {
    const isIE11 = !!window.MSInputMethodContext && !!document.documentMode
    return getTouchDeviceOS() === TOUCH_DEVICE_OS.WINDOWS || isIE11
  }

  get isAndroid() {
    return getTouchDeviceOS() === TOUCH_DEVICE_OS.ANDROID
  }

  get isIOS() {
    return getTouchDeviceOS() === TOUCH_DEVICE_OS.IOS
  }

  get isAndroidSingleColumn() {
    const {
      gridSettings: { cols },
    } = this
    return cols === 1 && this.isAndroid
  }

  get isAndroidMultipleColumns() {
    const {
      gridSettings: { cols },
    } = this
    return cols > 1 && this.isAndroid
  }

  get isIOSSingleColumn() {
    const {
      gridSettings: { cols },
    } = this
    return cols === 1 && this.isIOS
  }

  get isIOSMultipleColumns() {
    const {
      gridSettings: { cols },
    } = this
    return cols > 1 && this.isIOS
  }

  get isPortrait() {
    // assumes that the client is a mobile device
    return window.innerHeight > window.innerWidth
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
  async openBlankContentTool(options = {}) {
    const { viewingCollection, blankContentToolState } = this
    const { placeholderCard } = blankContentToolState
    if (
      placeholderCard &&
      (placeholderCard.col !== options.col ||
        placeholderCard.row !== options.row)
    ) {
      // if we have a placeholder and we're trying to open from the a different spot, close it
      await this.closeBlankContentTool()
    }
    runInAction(() => {
      this.deselectCards()
      this.closeCardMenu()
      this.clearTextEditingCard()
      const { placeholderCard, blankType } = this.blankContentToolState
      const openingBctFromHotEdge =
        placeholderCard &&
        blankType === 'hotcell' &&
        options &&
        options.blankType !== 'hotcell'
      const bctState = openingBctFromHotEdge
        ? {
            ...this.defaultBCTState,
            placeholderCard,
          }
        : this.defaultBCTState

      this.blankContentToolState = {
        ...bctState,
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
    })
  }

  @computed
  get blankContentToolIsOpen() {
    const { blankContentToolState } = this
    return (
      blankContentToolState.order !== null || blankContentToolState.row !== null
    )
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
  async closeBlankContentTool({ force = false } = {}) {
    const { viewingCollection } = this
    if (
      !force &&
      viewingCollection &&
      !viewingCollection.isBoard &&
      viewingCollection.isEmpty
    ) {
      // shouldn't be allowed to close BCT on empty collection, send back to default
      // -- also helps with the setup of SubmissionBox where you can close the bottom BCT
      this.openBlankContentTool()
    } else {
      const { placeholderCard } = this.blankContentToolState
      if (placeholderCard) {
        await placeholderCard.API_destroy()
      }
      // don't over-eagerly set this observable if it's already closed
      if (this.blankContentToolIsOpen) {
        runInAction(() => {
          const replacingCard = _.first(
            this.apiStore
              .findAll('collection_cards')
              .filter(cc => cc.currentlyReplacing)
          )
          if (replacingCard) {
            replacingCard.stopReplacing()
          }
          this.blankContentToolState = { ...this.defaultBCTState }
        })
      }
    }
  }

  @action
  setBctPlaceholderCard(card) {
    this.blankContentToolState.placeholderCard = card
  }

  @action
  setViewingRecord(record = null) {
    // escape if we're already viewing this collection
    if (
      this.viewingRecord &&
      record &&
      this.viewingRecord.id === record.id &&
      this.viewingRecord.internalType === record.internalType
    ) {
      return
    }
    if (this.viewingRecord) {
      this.previousViewingRecord = this.viewingRecord
      // clear out previous collaborators
      this.previousViewingRecord.setCollaborators([])
    }
    this.viewingRecord = record
    this.deselectCards()
  }

  @computed
  get viewingCollection() {
    return this.viewingRecord && this.viewingRecord.isCollection
      ? this.viewingRecord
      : null
  }

  @computed
  get viewingItem() {
    return this.viewingRecord && this.viewingRecord.isItem
      ? this.viewingRecord
      : null
  }

  @computed
  get viewingCollectionId() {
    const { viewingCollection } = this
    return viewingCollection ? viewingCollection.id : null
  }

  setBodyBackgroundImage(image_url = null) {
    if (image_url) {
      _.assign(document.body.style, {
        'background-image': `url('${image_url}')`,
      })
    } else {
      _.assign(document.body.style, {
        'background-image': null,
      })
    }
  }

  setBodyFontColor(color = null) {
    _.assign(document.body.style, {
      color,
    })
  }

  @action
  clearTextEditingCard() {
    this.textEditingItem = null
    this.textEditingCardId = null
    this.textEditingItemHasTitleText = false
    this.clearTempTextCardItems()
  }

  @action
  clearTempTextCardItems({
    hotSwapQuillContent = null,
    hotSwapQuillPosition = 0,
  } = {}) {
    const { viewingCollection } = this
    if (!viewingCollection) return

    const { newPersistedTextCard } = viewingCollection
    if (newPersistedTextCard && hotSwapQuillContent) {
      // swap out the temp text card (currently editing) for the persisted one
      newPersistedTextCard.record.quill_data = hotSwapQuillContent
      this.hotSwapQuillPosition = hotSwapQuillPosition
      this.setTextEditingCard(newPersistedTextCard)
    }
    viewingCollection.tempTextCard = null
    viewingCollection.newPersistedTextCard = null
  }

  @action
  setTextEditingCard(card, { hasTitleText = false } = {}) {
    this.textEditingItem = card.record
    this.textEditingCardId = card.id
    this.textEditingItemHasTitleText = hasTitleText
  }

  get isEditingText() {
    const { textEditingItem, viewingItem } = this
    return !!(textEditingItem || (viewingItem && viewingItem.isText))
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
      const parentSectionCard = this.parentSection(cardId)
      if (parentSectionCard && this.isSelected(parentSectionCard.id)) {
        this.selectedCardIds.remove(parentSectionCard.id)
      }
      this.selectedCardIds.remove(cardId)
    } else {
      this.selectedCardIds.push(cardId)
    }
    this.broadcastCardSelection([...this.selectedCardIds])
  }

  @action
  reselectCardIds(cardIds = []) {
    let newSelected = cardIds

    // select all cards inside of any selected sections
    const { viewingCollection } = this
    if (viewingCollection) {
      // look up section cards in the collection, filtering ones that are selected
      const selectedSections = viewingCollection.collection_cards.filter(
        cc => cc.isSection && _.includes(cardIds, cc.id)
      )
      _.each(selectedSections, section => {
        // combine newSelected with cards in the section
        newSelected = _.reverse(
          _.uniq(_.concat(newSelected, this.cardIdsInSection(section.id)))
        )
      })
    }

    if (_.isEqual([...this.selectedCardIds], newSelected)) {
      return
    }

    this.selectedCardIds.replace(newSelected)
    this.broadcastCardSelection([...newSelected])
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
  selectCardIds(cardIds) {
    this.reselectCardIds(_.uniq([...this.selectedCardIds, ...cardIds]))
  }

  broadcastCardSelection = cardIds => {
    const { viewingCollection } = this
    if (!viewingCollection) {
      return
    }
    const channel = ChannelManager.getChannel(
      COLLECTION_CHANNEL_NAME,
      viewingCollection.id
    )
    if (channel) {
      channel.perform('cards_selected', { card_ids: cardIds })
    }
  }

  broadcastCursorPosition = coordinates => {
    const { viewingCollection } = this
    if (!viewingCollection) {
      return
    }
    const channel = ChannelManager.getChannel(
      COLLECTION_CHANNEL_NAME,
      viewingCollection.id
    )
    if (channel && viewingCollection.collaborators.length >= 1) {
      channel.perform('cursor', { coordinates })
    }
  }

  reselectOnlyEditableRecords(cardIds = this.selectedCardIds) {
    const filteredCards = this.apiStore
      .findAll('collection_cards')
      .filter(
        card =>
          _.includes(cardIds, card.id) &&
          (card.link ||
            (card.record && card.record.can_edit) ||
            card.isSection ||
            (card.isBctPlaceholder && card.can_edit_parent))
      )
    const filteredCardIds = _.map(filteredCards, 'id')
    const removedCount = this.selectedCardIds.length - filteredCardIds.length
    this.reselectCardIds(filteredCardIds)
    return removedCount
  }

  reselectOnlyMovableCards(cardIds = this.selectedCardIds) {
    // NOTE: this will only *reject* ones that we know we can't move
    const rejectCards = _.filter(
      this.apiStore.findAll('collection_cards'),
      card => _.includes(cardIds, card.id) && !card.canMove
    )
    if (rejectCards.length === 0) return

    const rejectCardIds = _.map(rejectCards, 'id')
    const filteredCardIds = _.reject(cardIds, id =>
      _.includes(rejectCardIds, id)
    )
    const removedCount = rejectCardIds.length
    this.reselectCardIds(filteredCardIds)
    return removedCount
  }

  reselectWithoutPlaceholders(cardIds = this.selectedCardIds) {
    const rejectCards = _.filter(
      this.apiStore.findAll('collection_cards'),
      card => _.includes(cardIds, card.id) && card.isBctPlaceholder
    )
    if (rejectCards.length === 0) return

    const rejectCardIds = _.map(rejectCards, 'id')
    const filteredCardIds = _.reject(cardIds, id =>
      _.includes(rejectCardIds, id)
    )
    const removedCount = rejectCardIds.length
    this.reselectCardIds(filteredCardIds)
    return removedCount
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
    const allCardIds = _.map(collection.collection_cards, 'id')
    this.reselectCardIds(allCardIds)
    try {
      const cardIds = await collection.API_fetchAllCardIds()
      const newIds = _.difference(_.map(cardIds, 'id'), allCardIds)
      if (newIds.length > 0) {
        // now additionally select any new card ids (that weren't on screen)
        this.selectCardIds(newIds)
      }
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
  setActivityLogPage(page) {
    this.activityLogPage = page
    localStorage.setItem(ACTIVITY_LOG_PAGE_KEY, page)
  }

  @action
  openOptionalMenus(opts = {}) {
    if (opts) {
      if (opts.open) {
        this.setActivityLogPage(opts.open)
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
    this.closeTouchActionMenu()
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

    if (!lastSelectedCardId) return this.reselectCardIds([cardId])
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
    return this.reselectCardIds(newSelected)
  }

  @action
  cardIdsInSection(cardId) {
    // Get cardIds that are between this card and the last selected card
    return this.viewingCollection.cardIdsBetween(
      // get everything between the corners of the section
      cardId,
      cardId
    )
  }

  parentSection(cardId) {
    return _.first(
      this.viewingCollection.collection_cards.filter(
        cc => cc.isSection && _.includes(this.cardIdsInSection(cc.id), cardId)
      )
    )
  }

  isSelected(cardId) {
    if (this.selectedCardIds.length === 0) return false
    return this.selectedCardIds.findIndex(id => id === cardId) > -1
  }
  // --- BCT + GridCard properties />

  @action
  expandAndOpenThread(key) {
    // make sure the activityLog is open
    this.activityLogOpen = true
    // when we expand a thread we also want it to set the ActivityLog to Comments
    this.setActivityLogPage('comments')
    this.expandThread(key)
  }

  @action
  expandThread(key, { reset = false } = {}) {
    if (key) {
      // reset it first, that way if it's expanded offscreen, it will get re-opened/scrolled to
      if (reset) this.expandedThreadKey = null
    } else {
      this.setCommentingOnRecord(null)
    }
    this.expandedThreadKey = key
  }

  @action
  setCommentThreadBottomVisible(isVisible) {
    this.commentThreadBottomVisible = isVisible
  }

  @action
  setReplyingToComment(replyingToCommentId) {
    if (
      !!replyingToCommentId &&
      this.replyingToCommentId !== replyingToCommentId
    ) {
      this.toggleCommentHighlightActive(
        this.replyingToCommentId,
        replyingToCommentId
      )
      this.setCommentingOnRecord(null)
    }
    this.replyingToCommentId = replyingToCommentId
  }

  toggleCommentHighlightActive(
    previousReplyingToCommentId,
    replyingToCommentId
  ) {
    let activeHighlightNode = null
    if (!!previousReplyingToCommentId) {
      // when something else was previously active, remove active
      const prevHighlightNode = document.querySelector(
        `sub[data-comment-id="${previousReplyingToCommentId}"]`
      )
      if (prevHighlightNode) {
        prevHighlightNode.classList.remove('highlightActive')
      }
    }
    activeHighlightNode = document.querySelector(
      `sub[data-comment-id="${replyingToCommentId}"]`
    )
    if (!activeHighlightNode) return
    activeHighlightNode.classList.add('highlightActive')
  }

  @action
  setCommentingOnRecord(record, { persisted = false } = {}) {
    if (!persisted) {
      this.toggleCommentHighlight(record)
    }
    if (!record) {
      this.resetSelectedTextRange()
    }
    this.commentingOnRecord = record
  }

  isCommentingOnTextRange() {
    const { commentingOnRecord } = this
    if (!commentingOnRecord) return false
    const card = commentingOnRecord.parent_collection_card
    if (!card) return false

    return this.cardHasSelectedTextRange(card.id)
  }

  cardHasSelectedTextRange(comparingCardId) {
    const { cardId, range } = this.selectedTextRangeForCard
    return cardId === comparingCardId && range && range.length > 0
  }

  @action
  selectTextRangeForCard({ range, quillEditor, cardId }) {
    if (!cardId || !range || !range.length) {
      return
    }

    const { index, length } = range
    // Only open text action menu if you have text selected
    if (range && range.length > 0) {
      this.cardMenuOpen.menuType = EVENT_SOURCE_TYPES.TEXT_EDITOR
    }

    const textContent = quillEditor.getText(index, length)
    this.selectedTextRangeForCard = { range, quillEditor, textContent, cardId }
  }

  get currentQuillEditor() {
    return this.selectedTextRangeForCard.quillEditor
  }

  toggleCommentHighlight(record) {
    const {
      currentQuillEditor,
      commentingOnRecord,
      selectedTextRangeForCard,
    } = this
    const { range } = selectedTextRangeForCard
    if (!currentQuillEditor || !range || !range.length) return

    const currentFormat = currentQuillEditor.getFormat(
      range.index,
      range.length
    )
    // if no record then un-highlight
    const val = record ? 'new' : false
    currentQuillEditor.formatText(
      range.index,
      range.length,
      {
        commentHighlight: val,
        commentHighlightResolved: false,
        ...currentFormat,
      },
      'api'
    )

    const currentRecord = record || commentingOnRecord
    if (currentRecord && currentRecord.isText) {
      if (
        this.textEditingItem !== currentRecord &&
        this.viewingRecord !== currentRecord
      ) {
        // store any highlight changes on the item.quill_data for editors that aren't editing
        // e.g. if this highlight was triggered externally by TextActionMenu
        currentRecord.quill_data = currentQuillEditor.getContents()
      } else {
        // if we're removing "new" highlights, bring back any ones that might have existed
        if (!val) {
          if (!_.isEmpty(this.quillSnapshot)) {
            // preserve the current selection
            const selection = currentQuillEditor.getSelection()
            currentQuillEditor.setContents(this.quillSnapshot)
            currentQuillEditor.setSelection(selection)
          }
        }
      }
    }
  }

  @action
  resetSelectedTextRange() {
    const prevRecord = this.commentingOnRecord
    if (prevRecord && prevRecord.isText) {
      prevRecord.removeNewHighlights()
    }
    this.selectedTextRangeForCard = { ...this.defaultSelectedTextRange }
  }

  // after performing an action (event), track following the record for notifications
  trackEvent(event, record) {
    this.trackRecord(record.identifier)
    if (record.isItem && record.parent) {
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
    if (!this.modalContentRef || !this.modalContentRef.current) return
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

  scrollToBottomOfComments(commentId = null, scrollOpts = {}) {
    let { bottom } = v.commentScrollOpts
    let offset = 0
    if (commentId) {
      bottom = `${commentId}-replies-bottom`
      offset =
        -1 *
        document.getElementById(v.commentScrollOpts.containerId).clientHeight
    }
    this.scroller.scrollTo(bottom, {
      ...v.commentScrollOpts,
      ...scrollOpts,
      offset,
    })
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
      // retain the breadcrumb trail that you're linking from, concat with the linking point
      const combined = linkedBreadcrumbTrail.concat(
        breadcrumb.slice(foundIdx + 1)
      )
      const foundCount = _.filter(combined, { id: record.id }).length
      if (foundCount > 1) {
        // if we've looped back around (current record was linked further up the trail)
        // reset rather than show Collection X -> Link -> Collection X
        this.linkedBreadcrumbTrail.replace([])
        return breadcrumb
      }
      return combined
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

  @action
  setHoveringOver(opts) {
    if (!opts) {
      this.hoveringOver = { ...this.hoveringOverDefaults }
    } else {
      this.hoveringOver = { ...this.hoveringOverDefaults, ...opts }
    }
  }

  @action
  updatePlaceholderPosition(position = {}) {
    _.assign(this.placeholderPosition, position)
  }

  get scrollMaxX() {
    return (
      window.scrollMaxX ||
      document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    )
  }

  get scrollMaxY() {
    return (
      window.scrollMaxY ||
      document.documentElement.scrollHeight -
        document.documentElement.clientHeight
    )
  }

  get percentScrolledX() {
    const { scrollMaxX } = this
    // in the case where you don't have much horizontalScroll, default to midpoint
    if (scrollMaxX < 20) return 0.5
    const percent = window.pageXOffset / scrollMaxX
    return _.clamp(percent, 0.05, 0.95)
  }

  get percentScrolledY() {
    const { scrollMaxY } = this
    return window.pageYOffset / scrollMaxY
  }

  // -----------------------
  // Foamcore zoom functions
  zoomOut(useTimeout = true) {
    this.zoomAndScroll(1, useTimeout)
  }

  zoomIn(useTimeout = true) {
    this.zoomAndScroll(-1, useTimeout)
  }

  @action
  zoomAndScroll(zoomChange, useTimeout = true) {
    this.currentlyZooming = true
    // capture these percentages first
    const { percentScrolledX, percentScrolledY } = this
    const zoomBefore = this.zoomLevel
    const newZoomLevel = this.updateZoomLevel(this.zoomLevel + zoomChange)
    if (zoomBefore === newZoomLevel) {
      return
    }
    const afterTimeout = () => {
      runInAction(() => {
        // now we actually apply the new zoom level (resize the cards)
        this.zoomLevel = newZoomLevel
      })
      // now that the canvas is resized, we can determine how much to scroll
      const { scrollMaxX, scrollMaxY } = this
      let left = percentScrolledX * scrollMaxX
      const top = percentScrolledY * scrollMaxY
      if (newZoomLevel === this.zoomLevels.length) {
        // if we're all the way zoomed out, reset any horizontal scroll
        left = 0
      }
      window.scrollTo({
        left,
        top,
      })

      runInAction(() => {
        // finally, tell it we're not currently zooming which will re-enable card animation
        this.currentlyZooming = false
      })
    }
    if (useTimeout) {
      // timeout allows it to render with new tempZoomLevel + gridSize before trying to determine scroll
      setTimeout(afterTimeout)
    } else {
      // mainly just for unit tests
      afterTimeout()
    }
  }

  @action
  updateZoomLevel(val, collection = this.viewingCollection) {
    if (!collection || !collection.isBoard) return
    // tempZoomLevel gets set first to resize the board before actually resizing cards;
    // this is called within zoomAndScroll, which then sets this.zoomLevel
    this.tempZoomLevel = _.clamp(val, 1, this.zoomLevels.length)
    collection.lastZoom = this.tempZoomLevel
    return this.tempZoomLevel
  }

  @action
  determineZoomLevels(collection) {
    if (collection.isSplitLevelBottom) {
      return
    }
    const { windowWidth } = this
    const maxCols = this.maxCols(collection)
    const pageMargins = this.pageMargins(collection)
    const marginLeft = pageMargins.left

    let possibleCols = [1, 2, 4, 6, 8, 16]
    possibleCols = _.filter(possibleCols, col => {
      return (
        col <= maxCols &&
        this.maxGridWidth({ marginLeft, maxCols: col }) >= windowWidth
      )
    })

    const zoomLevels = _.map(possibleCols, col => ({
      col,
      relativeZoomLevel:
        this.maxGridWidth({ marginLeft, maxCols: col }) / windowWidth,
    }))

    if (zoomLevels.length > 0) {
      const firstZoom = zoomLevels[0]
      const diff = firstZoom.relativeZoomLevel - 1
      if (diff < 0.05 || (zoomLevels.length > 1 && diff < 0.1)) {
        // adjust this to just be fully zoomed
        zoomLevels[0].relativeZoomLevel = 1
      }
    }
    if (zoomLevels.length === 0 || zoomLevels[0].relativeZoomLevel > 1) {
      zoomLevels.unshift({
        relativeZoomLevel: 1,
      })
    }
    this.zoomLevels.replace(zoomLevels)
    this.adjustZoomLevel(collection)
  }

  @action
  adjustZoomLevel = collection => {
    const { lastZoom } = collection
    if (lastZoom) {
      this.zoomLevel = _.clamp(lastZoom, 1, this.zoomLevels.length)
    } else {
      // if we haven't marked specific zoom on this collection, zoom out if needed
      // and only store uiStore.zoomLevel, not the collection.lastZoom
      this.zoomLevel = this.zoomLevels.length
    }
    this.tempZoomLevel = this.zoomLevel
  }

  get relativeZoomLevel() {
    return this.calculatedZoomLevel()
  }

  // this helps us calculate the grid size we are about to enter, so that scrolling can happen before zoom render
  get relativeTempZoomLevel() {
    return this.calculatedZoomLevel('temp')
  }

  calculatedZoomLevel(type = 'current') {
    const zoomLevel = type === 'current' ? this.zoomLevel : this.tempZoomLevel
    if (this.zoomLevels.length < zoomLevel) {
      // e.g. when first initializing the page, before determineZoomLevels
      return 1
    }
    // zoomLevels start at 1, so we subtract to get the array idx
    const zoom = this.zoomLevels[zoomLevel - 1]
    return zoom ? zoom.relativeZoomLevel : 1
  }

  @action
  setDroppingFilesCount(droppingFilesCount) {
    if (this.droppingFilesCount !== droppingFilesCount) {
      this.droppingFilesCount = droppingFilesCount
    }
  }

  @action
  setVisibleRows(visibleRows) {
    this.visibleRows = visibleRows
  }

  @action
  setPlaceholderSpot(placeholderSpot = this.placeholderDefaults) {
    if (!objectsEqual(this.placeholderSpot, placeholderSpot)) {
      const { row, col, width, height, type } = placeholderSpot
      this.placeholderSpot.row = row
      this.placeholderSpot.col = col
      this.placeholderSpot.width = width
      this.placeholderSpot.height = height
      this.placeholderSpot.type = type
    }
  }

  pageMargins(collection) {
    return {
      ...calculatePageMargins({
        fullWidth: collection.isFourWideBoard,
      }),
      top: v.headerHeight + 90,
    }
  }

  maxCols(collection) {
    // NOTE: if we ever allow >16, this still limits max zoom level to show only 16
    const max = this.isTouchDevice && this.isMobile ? MAX_COLS_MOBILE : MAX_COLS
    return _.min([collection.num_columns, max])
  }

  // This returns the grid with (in pixels) for showing the full width of cards;
  // for mobile this gets bumped down and may not include all 16 columns (only 8 for large board)
  maxGridWidth({ marginLeft, maxCols }) {
    // always use full gridSettings for foamcore
    const { windowWidth } = this
    const { gridW, gutter } = v.defaultGridSettings
    let gridWidth = (gridW + gutter) * maxCols + marginLeft

    const zoomLevelEstimate = gridWidth / windowWidth
    // we have to adjust since the margins and the scale of zoom will both factor into the actual width
    gridWidth += marginLeft * _.max([0, zoomLevelEstimate - 1])
    return gridWidth
  }

  positionForCoordinates({
    col,
    row,
    width = 1,
    height = 1,
    isSection = false,
  }) {
    const { gridW, gridH, gutter } = v.defaultGridSettings
    const { relativeZoomLevel } = this
    const pos = {
      x: (col * (gridW + gutter)) / relativeZoomLevel,
      y: (row * (gridH + gutter)) / relativeZoomLevel,
      w: width * (gridW + gutter) - gutter,
      h: height * (gridH + gutter) - gutter,
    }

    if (isSection) {
      // sections are positioned in (x,y) by half a card, and adjusted to be smaller by a full card amount
      // TODO: sections should actually overlap the gutter so this should adjust slightly
      _.assign(pos, {
        x: (col * (gridW + gutter) + gridW / 2) / relativeZoomLevel,
        y: (row * (gridH + gutter) + gridH / 2) / relativeZoomLevel,
        w: (width - 1) * (gridW + gutter) - gutter,
        h: (height - 1) * (gridH + gutter) - gutter,
      })
    }

    // TODO: why sometimes NaN? zoomLevel divide by 0??
    if (_.isNaN(pos.x)) {
      pos.x = 0
      pos.y = 0
    }
    // TODO try and get rid of {x|y}Pos
    return {
      ...pos,
      xPos: pos.x,
      yPos: pos.y,
      width: pos.w,
      height: pos.h,
    }
  }

  coordinatesForPosition(position) {
    const collection = this.viewingCollection
    const { gridW, gridH, gutter } = v.defaultGridSettings
    const { relativeZoomLevel } = this
    const { x, y } = position
    const width = position.width || 1

    let col = Math.floor((x / (gridW + gutter)) * relativeZoomLevel)
    let row = Math.floor((y / (gridH + gutter)) * relativeZoomLevel)
    if (row < 0) {
      row = 0
    }
    // even though we restrict coordinates to being within the grid,
    // we want to know if horizontalScroll should be disabled based on unmodified col
    const outsideDraggableArea = col >= collection.num_columns || col < 0

    col = _.clamp(col, 0, collection.num_columns - width)
    return { col, row, outsideDraggableArea }
  }

  createRoles = (entities, roleName, opts = {}, record) => {
    let { id, internalType } = record
    const userIds = entities
      .filter(entity => entity.internalType === 'users')
      .map(user => user.id)
    const groupIds = entities
      .filter(entity => entity.internalType === 'groups')
      .map(group => group.id)
    const data = {
      role: { name: roleName },
      group_ids: groupIds,
      user_ids: userIds,
      is_switching: opts.isSwitching,
      send_invites: opts.sendInvites,
    }
    if (opts.addToGroupId) {
      id = opts.addToGroupId
      internalType = 'groups'
    }
    return this.apiStore
      .request(`${internalType}/${id}/roles`, 'POST', data)
      .catch(err => {
        this.alert(err.error[0])
      })
  }

  get foamcoreBoundingRectangle() {
    let rect = { left: 0, top: 0 }
    const container = document.querySelector(`.${FOAMCORE_INTERACTION_LAYER}`)
    if (container) {
      // just a guard for jest shallow render
      rect = container.getBoundingClientRect()
    }
    return rect
  }
}
