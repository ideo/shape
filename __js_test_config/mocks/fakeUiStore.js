const fakeUiStore = {
  gridSettings: {
    cols: 4,
    gutter: 20,
    gridW: 312,
    gridH: 250,
  },
  blankContentToolState: {
    order: null,
    width: null,
    height: null,
    replacingId: null,
  },
  dialogConfig: {
    open: null,
    prompt: null,
    onConfirm: null,
    onCancel: null,
    iconName: null,
    confirmText: 'OK',
    cancelText: 'Cancel',
    onClose: jest.fn(),
  },
  activityLogOpen: false,
  activityLogPosition: {
    x: 0,
    y: 0,
    h: 1,
    w: 1,
  },
  activityLogMoving: false,
  scroll: {
    scrollToTop: jest.fn(),
    scrollToBottom: jest.fn(),
  },
  cardMenuOpen: {
    id: false,
    x: 0,
    y: 0,
  },
  closeBlankContentTool: jest.fn(),
  closeCardMenu: jest.fn(),
  openCardMenu: jest.fn(),
  closeMoveMenu: jest.fn(),
  resetSelectionAndBCT: jest.fn(),
  rolesMenuOpen: false,
  isLoading: false,
  selectedCardIds: [],
  selectCardId: jest.fn(),
  setViewingCollection: jest.fn(),
  setViewingItem: jest.fn(),
  viewingCollection: null,
  movingFromCollectionId: null,
  movingCardIds: [],
  openMoveMenu: jest.fn(),
  update: jest.fn(),
  alert: jest.fn(),
  alertOk: jest.fn(),
  defaultAlertError: jest.fn(),
  confirm: jest.fn(),
  closeDialog: jest.fn(),
  cardAction: 'move',
  blurContent: false,
  organizationMenuPage: 'organizationMenuPage',
  organizationMenuGroupId: null,
  expandedThreadKey: null,
  expandThread: jest.fn(),
  openGroup: jest.fn(),
  openOptionalMenus: jest.fn(),
  trackEvent: jest.fn(),
  trackedRecords: {},
  editingName: false,
  activityLogPage: 'comments',
  pageMenuOpen: false,
  searchText: '',
  collectionCardSortOrder: '',
  addNewCard: jest.fn(),
  removeNewCard: jest.fn(),
  isNewCard: jest.fn(),
  editingCardId: 0,
  toggleEditingCardId: jest.fn(),
  autocompleteMenuClosed: jest.fn(),
  captureKeyboardGridClick: jest.fn(),
}

export default fakeUiStore
