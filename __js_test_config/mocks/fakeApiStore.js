import fakeUiStore from './fakeUiStore'

const fakeApiStore = ({
  findResult = '',
  findAllResult = [],
  requestResult = { data: {} },
} = {}) => {
  return {
    sessionLoaded: true,
    add: jest.fn().mockName('add'),
    removeAll: jest.fn().mockName('removeAll'),
    find: jest.fn().mockReturnValue(findResult),
    findAll: jest.fn().mockReturnValue(findAllResult),
    request: jest
      .fn()
      .mockReturnValue(Promise.resolve(requestResult))
      .mockName('request'),
    requestJson: jest.fn().mockReturnValue(Promise.resolve({ data: [] })),
    fetch: jest
      .fn()
      .mockReturnValue(Promise.resolve(requestResult))
      .mockName('fetch'),
    fetchRoles: jest
      .fn()
      .mockReturnValue(Promise.resolve())
      .mockName('fetchRoles'),
    fetchShapeAdminUsers: jest
      .fn()
      .mockReturnValue(Promise.resolve(requestResult))
      .mockName('fetchShapeAdminUsers'),
    removeShapeAdminUser: jest.fn(),
    addShapeAdminUsers: jest.fn(),
    fetchTestCollections: jest
      .fn()
      .mockReturnValue(Promise.resolve(requestResult))
      .mockName('fetchTestCollections'),
    remove: jest.fn(),
    sync: jest.fn().mockName('sync'),
    loadCurrentUser: jest.fn().mockReturnValue(Promise.resolve()),
    createLimitedUser: jest.fn().mockReturnValue(Promise.resolve({ data: [] })),
    searchUsersAndGroups: jest
      .fn()
      .mockReturnValue(Promise.resolve({ data: [] })),
    searchUsers: jest
      .fn()
      .mockReturnValue(Promise.resolve({ data: [] })),
    searchCollections: jest.fn().mockReturnValue(Promise.resolve({ data: [] })),
    checkCurrentOrg: jest.fn(),
    loadCurrentUserGroups: jest.fn(),
    searchRoles: jest.fn().mockReturnValue(Promise.resolve({ data: [] })),
    setCurrentUserId: jest.fn(),
    findOrganizationById: jest.fn().mockReturnValue({ name: 'abc' }),
    fetchThreads: jest.fn().mockReturnValue(Promise.resolve()),
    fetchNotifications: jest.fn().mockReturnValue(Promise.resolve()),
    findOrBuildCommentThread: jest
      .fn()
      .mockReturnValue(Promise.resolve({ key: 'x' })),
    setupCommentThreadAndMenusForPage: jest
      .fn()
      .mockReturnValue(Promise.resolve({ key: 'x' })),
    findThreadForRecord: jest.fn(),
    loadNextThreadPage: jest.fn(),
    createTemplateInstance: jest.fn().mockReturnValue(Promise.resolve({})),
    moveCards: jest.fn().mockReturnValue({}),
    linkCards: jest.fn().mockReturnValue({}),
    duplicateCards: jest.fn().mockReturnValue({}),
    checkInMyCollection: jest.fn(),
    collapseReplies: jest.fn(),
    openCurrentThreadToCommentOn: jest.fn(),
    expandAndOpenThreadForRecord: jest.fn(),
    alwaysShowCurrentThread: jest.fn(),
    updateModelId: jest.fn().mockImplementation((obj, id) => (obj.id = id)),
    unreadActivityCount: 0,
    selectedCards: [],

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
      handle: 'jappleseed',
      pic_url_square: 'https://s3.amazonaws.com/pic.png',
      groups: [],
      terms_accepted: true,
      API_hideHelper: jest.fn(),
      API_updateUseTemplateSetting: jest.fn(),
      API_fetchAllReviewableSubmissions: jest.fn(),
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
        visibleCommentsAndRepliesCount: 0,
      },
      {
        id: '2',
        key: 'abc-2',
        record: { name: 'xyz' },
        comments: [],
        users_thread: {
          subscribed: true,
        },
        visibleCommentsAndRepliesCount: 0,
      },
    ],
    collections: [],
    items: [],
    shapeAdminUsers: [],

    uiStore: fakeUiStore,
    undoStore: {},
    routingStore: {},
  }
}

export default fakeApiStore
