const fakeRoutingStore = {
  previousPageBeforeSearch: null,
  isHomepage: null,
  pathTo: jest.fn().mockReturnValue('/fake/path'),
  routeTo: jest.fn(),
  pathContains: jest.fn(),
  updatePreviousPageBeforeSearch: jest.fn(),
  leaveSearch: jest.fn(),
  slug: jest.fn().mockReturnValue('org-slug'),
  location: {
    pathname: '/xyz',
    search: '',
  }
}

export default fakeRoutingStore
