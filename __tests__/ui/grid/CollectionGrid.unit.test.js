import CollectionGrid from '~/ui/grid/CollectionGrid'

const fakeAttrs = {
  id: 1,
  name: 'My Cool Item',
}

const fakeItem = {
  ...fakeAttrs,
  rawAttributes: jest.fn().mockReturnValue(fakeAttrs),
  getRecordType: jest.fn().mockReturnValue('items'),
}
const fakeCard = {
  id: 10,
  order: 0,
  height: 1,
  width: 1,
  record: jest.fn().mockReturnValue(fakeItem),
  item: fakeItem,
}
const collection = {
  id: 1,
  name: 'My Workspace X',
  collection_cards: [
    fakeCard, fakeCard, fakeCard
  ]
}

let props, wrapper

beforeEach(() => {
  props = {
    collection,
    cols: 4,
    gridW: 200,
    gridH: 200,
    gutter: 10,
    updateCollection: jest.fn(),

    routingStore: {
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
    expect(wrapper.find('DraggableGridCard').at(0).props().cardType).toBe('items')
    expect(wrapper.find('DraggableGridCard').at(0).props().record).toBe(fakeAttrs)
    expect(wrapper.find('DraggableGridCard').length).toBe(3)
  })
})
