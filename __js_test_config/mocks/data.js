export const fakeTextItemAttrs = {
  id: 1,
  type: 'Item::TextItem',
  name: 'My Cool Item',
  text_data: 'This is the content for the item and it contains multiple sentences. Like this one.',
  breadcrumb: [['collections', 1, 'Some collection'], ['items', 1, 'my item']],
  parentPath: '/',
  can_edit: false,
}
export const fakeTextItem = {
  ...fakeTextItemAttrs,
  rawAttributes: jest.fn().mockReturnValue(fakeTextItemAttrs),
  getRecordType: jest.fn().mockReturnValue('items'),
  toJS: jest.fn().mockReturnValue(fakeTextItemAttrs),
}
export const fakeVideoItemAttrs = {
  id: 2,
  type: 'Item::VideoItem',
  name: 'Crazy Honey Badger',
  url: 'https://www.youtube.com/watch?v=4r7wHMg5Yjg',
  thumbnail_url: 'https://img.youtube.com/vi/4r7wHMg5Yjg/hqdefault.jpg',
  can_edit: false,
}
export const fakeVideoItem = {
  ...fakeVideoItemAttrs,
  rawAttributes: jest.fn().mockReturnValue(fakeTextItemAttrs),
  getRecordType: jest.fn().mockReturnValue('items'),
}
export const fakeImageItemAttrs = {
  id: 3,
  type: 'Item::ImageItem',
  name: 'Earth from Space',
  filestack_file: {
    id: 1,
    url: 'https://www.nasa.gov/sites/default/files/styles/full_width_feature/public/thumbnails/image/iss052e023801_0.jpg',
  },
  can_edit: false,
}
export const fakeImageItem = {
  ...fakeImageItemAttrs,
  rawAttributes: jest.fn().mockReturnValue(fakeTextItemAttrs),
  getRecordType: jest.fn().mockReturnValue('items'),
}
export const fakeItemCard = {
  id: 10,
  order: 0,
  height: 1,
  width: 1,
  record: fakeTextItem,
  item: fakeTextItem,
}
export const fakeCollectionCard = {
  id: 11,
  order: 1,
  height: 1,
  width: 1,
  record: fakeCollection,
  item: fakeCollection,
  reference: false,
}
export const fakeCollection = {
  id: 1,
  name: 'My Workspace X',
  type: 'Collection',
  breadcrumb: [],
  roles: [],
  tag_list: ['prototype', 'blockchain'],
  can_edit: false,
  collection_cards: [
    fakeItemCard, fakeItemCard, fakeItemCard
  ],
  // This is a computed property on the collection store
  cardIds: [
    fakeItemCard.id, fakeItemCard.id, fakeItemCard.id
  ],
  API_archive: jest.fn(),
}
export const fakeUserAttrs = {
  id: 1,
  first_name: 'Oprah',
  last_name: 'Winfrey',
  email: 'oprah@winfrey.com',
  pic_url_square: 'https://filestackcdn.com/abc123',
}
export const fakeUser = {
  ...fakeUserAttrs,
  rawAttributes: jest.fn().mockReturnValue(fakeUserAttrs),
  getRecordType: jest.fn().mockReturnValue('users'),
}
export const fakeRoleAttrs = {
  id: 1,
  name: 'editor',
  users: [fakeUser, fakeUser],
  resource: { id: 1, type: 'collection' }
}
export const fakeRole = {
  ...fakeRoleAttrs,
  rawAttributes: jest.fn().mockReturnValue(fakeRoleAttrs),
  getRecordType: jest.fn().mockReturnValue('roles'),
}
export const fakePosition = {
  xPos: 0,
  yPos: 0,
  height: 1,
  width: 1,
}
