import CollectionGrid from '~/ui/grid/CollectionGrid'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

import { fakeCollection, fakeItemCard } from '#/mocks/data'

let props, wrapper, component
const rerender = () => {
  wrapper = shallow(<CollectionGrid.wrappedComponent {...props} />)
  component = wrapper.instance()
}
beforeEach(() => {
  props = {
    collection: {
      ...fakeCollection,
      collection_cards: [fakeItemCard, fakeItemCard, fakeItemCard],
    },
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
  }
  rerender()
})

describe('CollectionGrid', () => {
  it('renders the Grid with draggable collection cards', () => {
    expect(wrapper.find('StyledGrid').exists()).toBe(true)
    expect(
      wrapper
        .find('MovableGridCard')
        .at(0)
        .props().cardType
    ).toEqual('items')
    expect(
      wrapper
        .find('MovableGridCard')
        .at(0)
        .props().record
    ).toEqual(fakeItemCard.record)
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

  describe('positionCards', () => {
    const collection_cards = [
      { ...fakeItemCard, id: '1', width: 1, height: 1 },
      { ...fakeItemCard, id: '2', width: 2, height: 1 },
      { ...fakeItemCard, id: '3', width: 1, height: 2 },
      { ...fakeItemCard, id: '4', width: 2, height: 2 },
      { ...fakeItemCard, id: '5', width: 1, height: 2 },
      { ...fakeItemCard, id: '6', width: 4, height: 1 },
      { ...fakeItemCard, id: '7', width: 3, height: 1 },
      { ...fakeItemCard, id: '8', width: 2, height: 1 },
    ]
    beforeEach(() => {
      props.collection.collection_cards = collection_cards
      rerender()
    })
    it('should create a matrix', () => {
      component.positionCards(collection_cards)
      expect(component.matrix).toEqual([
        ['1', '2', '2', '3'],
        ['4', '4', '5', '3'],
        ['4', '4', '5', null],
        ['6', '6', '6', '6'],
        ['7', '7', '7', null],
        ['8', '8', null, null],
      ])
    })

    describe('findOverlap', () => {
      it('should find the card being hovered over, using the matrix', () => {
        const dragPosition = {
          dragX: props.gridW * 3,
          dragY: props.gridH * 2,
        }
        let overlap = component.findOverlap('1', dragPosition)
        // 3 over, 2 down in the matrix above
        expect(overlap.card.id).toEqual('5')
        expect(overlap.direction).toEqual('left')
        // card 5 cannot overlap itself
        overlap = component.findOverlap('5', dragPosition)
        expect(overlap).toEqual(null)
      })
    })
  })
})
