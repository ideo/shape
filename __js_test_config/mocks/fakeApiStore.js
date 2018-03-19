const fakeApiStore = ({ findResult = '', findAllResult = [], requestResult = '' } = {}) => {
  return {
    find: jest.fn()
      .mockReturnValue(findResult),
    findAll: jest.fn()
      .mockReturnValue(findAllResult),
    request: jest.fn()
      .mockReturnValue(Promise.resolve(requestResult))
      .mockName('request'),
    sync: jest.fn().mockName('sync'),
    setCurrentUserId: jest.fn(),
    currentUser: {
      current_user_collection_id: 99,
      current_organization: {
        name: 'test org'
      }
    },
    collections: [],
    items: [],
  }
}

export default fakeApiStore
