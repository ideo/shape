import CollectionGrid from '~/ui/grid/CollectionGrid'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

import { fakeTextItem, fakeCollection, fakeItemCard } from '#/mocks/data'

let props, wrapper, component
const rerender = () => {
  wrapper = shallow(<CollectionGrid.wrappedComponent {...props} />)
  component = wrapper.instance()
}
beforeEach(() => {
  props = {
    collection: fakeCollection,
    canEditCollection: true,
    cols: 4,
    gridW: 200,
    gridH: 200,
    gutter: 10,
    sortBy: 'order',
    loadCollectionCards: jest.fn(),
    updateCollection: jest.fn(),
    cardProperties: [],
    apiStore: fakeApiStore(),
    uiStore: fakeUiStore,
    routingStore: {
      routeTo: jest.fn(),
      push: jest.fn(),
    },
  }
  rerender()
})

describe('CollectionGrid', () => {
  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  it('renders the Grid with draggable collection cards', () => {
    expect(wrapper.find('StyledGrid').exists()).toBe(true)
    expect(
      wrapper
        .find('MovableGridCard')
        .at(0)
        .props().cardType
    ).toBe('items')
    expect(
      wrapper
        .find('MovableGridCard')
        .at(0)
        .props().record
    ).toBe(fakeTextItem)
    // 3 cards + 1 empty card
    expect(wrapper.find('MovableGridCard').length).toBe(4)
    expect(wrapper.find('MovableGridCard[cardType="items"]').length).toBe(3)
  })

  it('re-renders when cardProperties have changed', () => {
    wrapper.setProps({
      collection: { ...fakeCollection, collection_cards: [fakeItemCard] },
    })
    // no changes because we did not change cardProperties
    expect(wrapper.find('MovableGridCard[cardType="items"]').length).toBe(3)
    wrapper.setProps({
      collection: { ...fakeCollection, collection_cards: [fakeItemCard] },
      cardProperties: [{ id: 'new' }],
    })
    // it does re-render with a change to cardProperties
    expect(wrapper.find('MovableGridCard[cardType="items"]').length).toBe(1)
  })

  describe('movingAllCards', () => {
    beforeEach(() => {
      props.collection.collection_card_count = 3
      props.uiStore.movingFromCollectionId = props.collection.id
      props.uiStore.movingCardIds = ['1', '2', '3']
    })

    describe('moving within the same collection', () => {
      it('returns true if moving all cards in the collection', () => {
        props.uiStore.cardAction = 'move'
        rerender()
        expect(component.movingAllCards).toBe(true)
      })

      it('returns false if the cardAction is not "move"', () => {
        props.uiStore.cardAction = 'link'
        rerender()
        expect(component.movingAllCards).toBe(false)
      })
    })

    describe('moving between collections', () => {
      it('returns false', () => {
        props.uiStore.cardAction = 'move'
        props.uiStore.movingFromCollectionId = '9876'
        rerender()
        expect(component.movingAllCards).toBe(false)
      })
    })
  })
})
