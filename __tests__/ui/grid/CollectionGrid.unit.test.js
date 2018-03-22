import CollectionGrid from '~/ui/grid/CollectionGrid'

import {
  fakeTextItem,
  fakeCollection
} from '#/mocks/data'

let props, wrapper
beforeEach(() => {
  props = {
    collection: fakeCollection,
    canEditCollection: true,
    collectionCards: fakeCollection.collection_cards,
    cols: 4,
    gridW: 200,
    gridH: 200,
    gutter: 10,
    updateCollection: jest.fn(),
    cardIds: fakeCollection.cardIds,
    uiStore: {
      blankContentToolState: null
    },
    routingStore: {
      routeTo: jest.fn(),
      push: jest.fn()
    }
  }
  wrapper = shallow(
    <CollectionGrid.wrappedComponent {...props} />
  )
})

describe('CollectionGrid', () => {
  it('renders the Grid with draggable collection cards', () => {
    expect(wrapper.find('.Grid').exists()).toBe(true)
    expect(wrapper.find('MovableGridCard').at(0).props().cardType).toBe('items')
    expect(wrapper.find('MovableGridCard').at(0).props().record).toBe(fakeTextItem)
    expect(wrapper.find('MovableGridCard').length).toBe(3)
  })
})
