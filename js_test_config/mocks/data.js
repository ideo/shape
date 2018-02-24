export const fakeItemAttrs = {
  id: 1,
  name: 'My Cool Item',
  content: 'This is the content for the item and it contains multiple sentences. Like this one.'
}
export const fakeItem = {
  ...fakeItemAttrs,
  rawAttributes: jest.fn().mockReturnValue(fakeItemAttrs),
  getRecordType: jest.fn().mockReturnValue('items'),
}
export const fakeCard = {
  id: 10,
  order: 0,
  height: 1,
  width: 1,
  record: fakeItem,
  item: fakeItem,
}
export const fakeCollectionCard = {
  id: 11,
  order: 1,
  height: 1,
  width: 1,
  record: fakeCollection,
  item: fakeCollection,
}
export const fakeCollection = {
  id: 1,
  name: 'My Workspace X',
  breadcrumb: [],
  collection_cards: [
    fakeCard, fakeCard, fakeCard
  ]
}
export const fakePosition = {
  xPos: 0,
  yPos: 0,
  height: 1,
  width: 1,
}
