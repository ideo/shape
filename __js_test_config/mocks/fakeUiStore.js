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
  closeBlankContentTool: jest.fn(),
  closeMoveMenu: jest.fn(),
  resetSelectionAndBCT: jest.fn(),
  rolesMenuOpen: false,
  isLoading: false,
  selectedCardIds: [],
  setViewingCollection: jest.fn(),
  viewingCollection: null,
  movingFromCollectionId: null,
  movingCardIds: [],
  update: jest.fn(),
}

export default fakeUiStore
