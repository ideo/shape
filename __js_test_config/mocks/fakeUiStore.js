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
  alertModal: {
    open: false,
    prompt: null,
    onConfirm: null,
    onCancel: null,
    icon: null,
    confirmText: null,
    cancelText: null,
  },
  closeBlankContentTool: jest.fn(),
  closeMoveMenu: jest.fn(),
  resetSelectionAndBCT: jest.fn(),
  rolesMenuOpen: false,
  isLoading: false,
  selectedCardIds: [],
  selectCardId: jest.fn(),
  setViewingCollection: jest.fn(),
  viewingCollection: null,
  movingFromCollectionId: null,
  movingCardIds: [],
  update: jest.fn(),
  openAlertModal: jest.fn(),
  closeAlertModal: jest.fn(),
}

export default fakeUiStore
