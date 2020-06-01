import CarouselCover from '~/ui/grid/covers/CarouselCover'

import { action, observable } from 'mobx'
import { fakeCollection, fakeTextItem } from '#/mocks/data'

let wrapper, component, rerender, props, fakeEvent
describe('CarouselCover', () => {
  beforeEach(() => {
    props = {
      collection: fakeCollection,
      updatedAt: fakeCollection.updated_at,
      dragging: false,
      onEmptyCarousel: jest.fn(),
    }
    props.collection.collection_cover_items = [
      Object.assign({}, fakeTextItem, { id: 1 }),
      Object.assign({}, fakeTextItem, { id: 2 }),
      Object.assign({}, fakeTextItem, { id: 3 }),
    ]
    // still use observable to properly handle render updates
    props.collection.carouselIdx = observable.box(0)
    props.collection.setCarouselIdx = action(idx => {
      const { collection } = props
      collection.carouselIdx.set(idx)
      collection.currentCarouselRecord = collection.collection_cover_items[idx]
    })
    props.collection.API_fetchCards.mockReturnValue(
      Promise.resolve(
        fakeCollection.collection_cover_items.map(item => ({ record: item }))
      )
    )
    rerender = function() {
      wrapper = shallow(<CarouselCover {...props} />)
      component = wrapper.instance()
      return wrapper
    }
    rerender()
  })

  describe('componentDidMount', () => {
    it("should fetch the collection's cards", () => {
      expect(props.collection.API_fetchCards).toHaveBeenCalled()
    })

    it('should set loading to false', () => {
      expect(component.loading).toBe(false)
    })

    describe('if there are no collections cards in the collection', () => {
      beforeEach(() => {
        props.collection.API_fetchCards.mockReset()
        props.collection.API_fetchCards.mockReturnValue(Promise.resolve([]))
        rerender()
      })

      it('should call onEmptyCarousel prop', () => {
        expect(props.onEmptyCarousel).toHaveBeenCalled()
      })
    })
  })

  describe('componentDidUpdate', () => {
    it("should re-fetch the collection's cards if updatedAt changes", () => {
      expect(props.collection.API_fetchCards).toHaveBeenCalled()
      props.collection.API_fetchCards.mockClear()
      wrapper.setProps({ updatedAt: new Date().toString() })
      expect(props.collection.API_fetchCards).toHaveBeenCalled()
    })
    it("should not re-fetch the collection's cards if updatedAt does not change", () => {
      expect(props.collection.API_fetchCards).toHaveBeenCalled()
      props.collection.API_fetchCards.mockClear()
      wrapper.setProps({ updatedAt: fakeCollection.updated_at })
      expect(props.collection.API_fetchCards).not.toHaveBeenCalled()
    })
  })

  describe('handleNavigate()', () => {
    describe('navigating between the items', () => {
      beforeEach(() => {
        fakeEvent = { stopPropagation: jest.fn() }
      })

      it('should navigate the the next or previous item', () => {
        expect(wrapper.find('CoverRenderer').props().record.id).toEqual(1)
        component.handleNavigate(fakeEvent, 1)
        expect(wrapper.find('CoverRenderer').props().record.id).toEqual(2)
        component.handleNavigate(fakeEvent, -1)
        expect(wrapper.find('CoverRenderer').props().record.id).toEqual(1)
      })

      it('should update the carousel control counter', () => {
        component.handleNavigate(fakeEvent, 1)
        expect(wrapper.find('[data-cy="ItemCount"]').text()).toEqual('2 / 3')
        component.handleNavigate(fakeEvent, 1)
        expect(wrapper.find('[data-cy="ItemCount"]').text()).toEqual('3 / 3')
      })
    })

    describe('if its navigating before the first item', () => {
      beforeEach(() => {
        fakeCollection.carouselIdx.set(0)
        component.handleNavigate(fakeEvent, -1)
      })

      it('should navigate to the last item', () => {
        expect(wrapper.find('CoverRenderer').props().record.id).toEqual(3)
      })
    })

    describe('if its navigating past the last item', () => {
      beforeEach(() => {
        fakeCollection.carouselIdx.set(2)
        component.handleNavigate(fakeEvent, 1)
      })
      it('should navigate to the first item', () => {
        expect(wrapper.find('CoverRenderer').props().record.id).toEqual(1)
      })
    })
  })
})
