const fakeUiStore = {
  gridSettings: {
    cols: 4,
    gutter: 20,
    gridW: 312,
    gridH: 250,
  },
  blankContentToolState: null,
  rolesMenuOpen: false,
  isLoading: false,
  selectedCardIds: [],
  setViewingCollection: jest.fn(),
  viewingCollection: null,
  update: jest.fn(),
}

export default fakeUiStore
