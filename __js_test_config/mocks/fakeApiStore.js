const fakeApiStore = ({ findResult = '', findAllResult = [], requestResult = '' } = {}) => {
  return {
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
    sync: jest.fn().mockName('sync'),
    setCurrentUserId: jest.fn(),
    currentUser: {
      current_user_collection_id: 99,
      current_organization: {
        name: 'test org'
      },
      name: 'Johnny Appleseed',
      pic_url_square: 'https://s3.amazonaws.com/pic.png',
      groups: [],
    },
    collections: [],
    items: [],
  }
}

export default fakeApiStore
