const fakeRoutingStore = {
  previousPageBeforeSearch: null,
  pathTo: jest.fn().mockReturnValue('/fake/path'),
  routeTo: jest.fn(),
  pathContains: jest.fn(),
  goToPath: jest.fn(),
  updatePreviousPageBeforeSearch: jest.fn(),
  leaveSearch: jest.fn(),
  slug: jest.fn().mockReturnValue('org-slug'),
  location: {
    pathname: '/xyz',
    search: '',
  },
  extraSearchParams: {},
}

export default fakeRoutingStore
