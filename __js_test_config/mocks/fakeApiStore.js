const fakeApiStore = ({ findResult = '', findAllResult = [], requestResult = '' } = {}) => {
  return {
    add: jest.fn().mockName('add'),
    removeAll: jest.fn().mockName('removeAll'),
    find: jest.fn()
      .mockReturnValue(findResult),
    findAll: jest.fn()
      .mockReturnValue(findAllResult),
    request: jest.fn()
      .mockReturnValue(Promise.resolve(requestResult))
      .mockName('request'),
    fetch: jest.fn()
      .mockReturnValue(Promise.resolve())
      .mockName('fetch'),
    fetchRoles: jest.fn()
      .mockReturnValue(Promise.resolve())
      .mockName('fetchRoles'),
    sync: jest.fn().mockName('sync'),
    loadCurrentUser: jest.fn(),
    loadCurrentUserGroups: jest.fn().mockReturnValue(Promise.resolve()),
    loadCurrentUserAndGroups: jest.fn().mockReturnValue(Promise.resolve()),
    setCurrentUserId: jest.fn(),
    findOrganizationById: jest.fn().mockReturnValue({ name: 'abc' }),
    fetchThreads: jest.fn().mockReturnValue(Promise.resolve()),
    fetchNotifications: jest.fn().mockReturnValue(Promise.resolve()),
    findOrBuildCommentThread: jest.fn().mockReturnValue(Promise.resolve()),
    unreadActivityCount: 0,
    currentUserId: 1,
    currentUser: {
      id: 1,
      current_user_collection_id: 99,
      current_organization: {
        name: 'test org'
      },
      organizations: [{ name: 'test org 1', filestack_file_url: 'test.jpg' }],
      name: 'Johnny Appleseed',
      pic_url_square: 'https://s3.amazonaws.com/pic.png',
      groups: [],
      terms_accepted: true,
      switchOrganization: jest.fn(),
      API_hideHotEdgeHelper: jest.fn(),
    },
    currentUserOrganization: {
      name: 'test org',
      primary_group: {
        name: 'test org',
      }
    },
    currentThreads: [
      {
        id: 1,
        key: 'abc-1',
        record: { name: 'abc' },
        comments: [],
      },
      {
        id: 2,
        key: 'abc-2',
        record: { name: 'xyz' },
        comments: [],
      }
    ],
    collections: [],
    items: [],
  }
}

export default fakeApiStore
