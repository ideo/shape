const fakeRoutingStore = {
  previousPageBeforeSearch: null,
  pathTo: jest.fn().mockReturnValue('/fake/path'),
  routeTo: jest.fn(),
  pathContains: jest.fn(),
  goToPath: jest.fn(),
  updatePreviousPageBeforeSearch: jest.fn(),
  leaveSearch: jest.fn(),
  slug: 'org-slug',
  location: {
    pathname: '/xyz',
    search: '',
  },
  extraSearchParams: {},
  scrollStates: [],
  updateScrollState: jest.fn(),
  toPathScrollY: jest.fn(),
  history: {},
  utmQueryParams: {
    utm_campign: 'marketing-campaign-1',
  },
  appendQueryString: jest.fn()
}

export default fakeRoutingStore
