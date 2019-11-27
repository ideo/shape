import CollectionGrid from '~/ui/grid/CollectionGrid'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

import { fakeTextItem, fakeCollection, fakeItemCard } from '#/mocks/data'

let props, wrapper
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
  wrapper = shallow(<CollectionGrid.wrappedComponent {...props} />)
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

  describe('calculateOrderForMovingCard', () => {
    describe('moving to first card position (0 index)', () => {
      it('returns an integer', () => {
        const locationOfTargetPlaceholder = -0.5
        expect(
          wrapper
            .instance()
            .calculateOrderForMovingCard(locationOfTargetPlaceholder, 0)
        ).toBe(0)
        expect(
          wrapper
            .instance()
            .calculateOrderForMovingCard(locationOfTargetPlaceholder, 1)
        ).toBe(1)
      })
    })
    describe('moving to last card position in collection', () => {
      it('returns an integer', () => {
        const locationOfTargetPlaceholder = 3.5
        expect(
          wrapper
            .instance()
            .calculateOrderForMovingCard(locationOfTargetPlaceholder, 0)
        ).toBe(4)
        expect(
          wrapper
            .instance()
            .calculateOrderForMovingCard(locationOfTargetPlaceholder, 1)
        ).toBe(5)
      })
    })
  })
})
