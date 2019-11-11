import CarouselCover from '~/ui/grid/covers/CarouselCover'

import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import { fakeCollection, fakeTextItem } from '#/mocks/data'

let wrapper, rerender, props

describe('CarouselCover', () => {
  beforeEach(() => {
    fakeCollection.collection_cover_items = [
      Object.assign({}, fakeTextItem, { id: 1 }),
      Object.assign({}, fakeTextItem, { id: 2 }),
      Object.assign({}, fakeTextItem, { id: 3 }),
    ]
    props = {
      collection: fakeCollection,
      dragging: false,
      routingStore: fakeRoutingStore,
    }
    rerender = function() {
      wrapper = shallow(<CarouselCover.wrappedComponent {...props} />)
      return wrapper
    }
    rerender()
  })

  describe('handleNavigate()', () => {
    describe('navigating between the items', () => {
      beforeEach(() => {
        wrapper.instance().handleNavigate(1)
      })

      it('should navigate the the next or previous item', () => {
        expect(wrapper.find('CoverRenderer').props().record.id).toEqual(2)
        wrapper.instance().handleNavigate(1)
        expect(wrapper.find('CoverRenderer').props().record.id).toEqual(3)
        wrapper.instance().handleNavigate(-1)
        expect(wrapper.find('CoverRenderer').props().record.id).toEqual(2)
      })

      it('should update the carousel control counter', () => {
        expect(wrapper.find('[data-cy="ItemCount"]').text()).toEqual('2 / 3')
        wrapper.instance().handleNavigate(1)
        expect(wrapper.find('[data-cy="ItemCount"]').text()).toEqual('3 / 3')
      })
    })

    describe('if its navigating before the first item', () => {
      beforeEach(() => {
        wrapper.instance().currentIdx = 0
        wrapper.instance().handleNavigate(-1)
      })

      it('should navigate to the last item', () => {
        expect(wrapper.find('CoverRenderer').props().record.id).toEqual(3)
      })
    })

    describe('if its navigating past the last item', () => {
      beforeEach(() => {
        wrapper.instance().currentIdx = 2
        wrapper.instance().handleNavigate(1)
      })
      it('should navigate to the first item', () => {
        expect(wrapper.find('CoverRenderer').props().record.id).toEqual(1)
      })
    })
  })

  describe('handleClick', () => {
    const fakeEv = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    }
    beforeEach(() => {
      wrapper.instance().handleClick(fakeEv)
    })

    it('should route to the colleciton with the routingStore', () => {
      expect(props.routingStore.routeTo).toHaveBeenCalled()
      expect(props.routingStore.routeTo).toHaveBeenCalledWith(
        'collections',
        props.collection.id
      )
    })
  })
})
