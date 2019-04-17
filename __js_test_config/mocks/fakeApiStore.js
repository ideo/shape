import fakeUiStore from './fakeUiStore'

const fakeApiStore = ({
  findResult = '',
  findAllResult = [],
  requestResult = { data: {} },
} = {}) => {
  return {
    add: jest.fn().mockName('add'),
    removeAll: jest.fn().mockName('removeAll'),
    find: jest.fn().mockReturnValue(findResult),
    findAll: jest.fn().mockReturnValue(findAllResult),
    request: jest
      .fn()
      .mockReturnValue(Promise.resolve(requestResult))
      .mockName('request'),
    fetch: jest
      .fn()
      .mockReturnValue(Promise.resolve(requestResult))
      .mockName('fetch'),
    fetchRoles: jest
      .fn()
      .mockReturnValue(Promise.resolve())
      .mockName('fetchRoles'),
    sync: jest.fn().mockName('sync'),
    loadCurrentUser: jest.fn().mockReturnValue(Promise.resolve()),
    searchUsersAndGroups: jest
      .fn()
      .mockReturnValue(Promise.resolve({ data: [] })),
    searchUsers: jest
      .fn()
      .mockReturnValue(Promise.resolve({ data: [] })),
    searchCollections: jest.fn().mockReturnValue(Promise.resolve({ data: [] })),
    loadCurrentUserGroups: jest.fn(),
    searchRoles: jest.fn().mockReturnValue(Promise.resolve({ data: [] })),
    setCurrentUserId: jest.fn(),
    findOrganizationById: jest.fn().mockReturnValue({ name: 'abc' }),
    fetchThreads: jest.fn().mockReturnValue(Promise.resolve()),
    fetchNotifications: jest.fn().mockReturnValue(Promise.resolve()),
    findOrBuildCommentThread: jest
      .fn()
      .mockReturnValue(Promise.resolve({ key: 'x' })),
    findThreadForRecord: jest.fn(),
    loadNextThreadPage: jest.fn(),
    createTemplateInstance: jest.fn(),
    moveCards: jest.fn(),
    linkCards: jest.fn(),
    duplicateCards: jest.fn(),
    checkInMyCollection: jest.fn(),
    unreadActivityCount: 0,

    usersThreadPagesToLoad: 1,
    loadingThreads: false,
    hasOlderThreads: false,

    currentUserId: '1',
    currentUser: {
      id: '1',
      current_user_collection_id: 99,
      current_organization: {
        name: 'Acme Inc',
        deactivated: false,
      },
      organizations: [{ name: 'Acme Inc 1', filestack_file_url: 'test.jpg' }],
      name: 'Johnny Appleseed',
      pic_url_square: 'https://s3.amazonaws.com/pic.png',
      groups: [],
      terms_accepted: true,
      switchOrganization: jest.fn(),
      API_hideHelper: jest.fn(),
    },
    // NOTE: important that this matches currentUserOrganization.slug
    currentOrgSlug: 'org-slug',
    currentUserOrganization: {
      id: '1',
      slug: 'org-slug',
      name: 'Acme Inc',
      primary_group: {
        name: 'Acme Inc',
      },
    },
    unreadNotifications: [],
    recentNotifications: new Map(),
    currentThreads: [
      {
        id: '1',
        key: 'abc-1',
        record: { name: 'abc' },
        comments: [],
        users_thread: {
          subscribed: true,
        },
      },
      {
        id: '2',
        key: 'abc-2',
        record: { name: 'xyz' },
        comments: [],
        users_thread: {
          subscribed: true,
        },
      },
    ],
    collections: [],
    items: [],

    uiStore: fakeUiStore,
    undoStore: {},
    routingStore: {},
  }
}

export default fakeApiStore
