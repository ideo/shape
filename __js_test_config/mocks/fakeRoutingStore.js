const fakeRoutingStore = {
  previousPageBeforeSearch: null,
  pathTo: jest.fn(),
  routeTo: jest.fn(),
  pathContains: jest.fn(),
  updatePreviousPageBeforeSearch: jest.fn(),
  leaveSearch: jest.fn(),
}

export default fakeRoutingStore
