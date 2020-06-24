import CollectionFilter from '~/ui/filtering/CollectionFilter'

import { apiStore } from '~/stores'
import { fakeCollection, fakeCollectionFilter } from '#/mocks/data'

jest.mock('../../../app/javascript/stores/index')

let wrapper, rerender, props

describe('CollectionFilter', () => {
  const collection = fakeCollection

  beforeEach(() => {
    props = {
      collection,
      canEdit: true,
    }
    rerender = function() {
      wrapper = shallow(<CollectionFilter {...props} />)
      return wrapper
    }
    rerender()
  })

  describe('render()', () => {
    describe('with some collection filters', () => {
      beforeEach(() => {
        props.collection.filterBarFilters = [fakeCollectionFilter]
        rerender()
      })

      it('should render the Filter Bar', () => {
        expect(wrapper.find('FilterBar').exists()).toBe(true)
      })
    })

    describe('with the current filter type not set', () => {
      it('should ensure the modal is not open', () => {
        const FilterSearchModal = wrapper.find('FilterSearchModal')
        expect(FilterSearchModal.exists()).toBe(false)
      })
    })

    describe('with the current filter type set to Tags', () => {
      let tagFilterA, tagFilterB, searchFilter, FilterSearchModal

      beforeEach(() => {
        tagFilterA = Object.assign({}, fakeCollectionFilter, { id: '3' })
        tagFilterB = Object.assign({}, fakeCollectionFilter, { id: '4' })
        searchFilter = Object.assign({}, fakeCollectionFilter, {
          id: '2',
          filter_type: 'search',
        })
        props.collection.filterBarFilters = [
          tagFilterA,
          tagFilterB,
          searchFilter,
        ]
        rerender()
        wrapper.instance().currentFilterLookupType = 'Tags'
        wrapper.update()
        FilterSearchModal = wrapper.find('FilterSearchModal')
      })

      it('should set the modal open', () => {
        expect(FilterSearchModal.props().modalOpen).toBe(true)
      })

      it('should pass the filter types type of filters to the Filter Modal', () => {
        const filterProps = FilterSearchModal.props().filters
        expect(filterProps.length).toEqual(2)
        expect(filterProps.map(f => f.id)).toEqual(
          expect.arrayContaining(['3', '4'])
        )
      })
    })

    describe('when you can edit', () => {
      beforeEach(() => {
        props.canEdit = true
        rerender()
      })

      it('should render the Filter Menu', () => {
        expect(wrapper.find('FilterMenu').exists()).toBe(true)
      })
    })

    describe('when you cannot edit', () => {
      beforeEach(() => {
        props.canEdit = false
        rerender()
      })

      it('should not render the Filter Menu', () => {
        expect(wrapper.find('FilterMenu').exists()).toBe(false)
      })
    })

    it('does not render method library filters', () => {
      expect(wrapper.find('MethodLibraryFilterBar').exists()).toBe(false)
    })

    describe('if collection is method library', () => {
      beforeEach(() => {
        props.collection.isParentMethodLibrary = true
        props.collection.methodLibraryFilters = [fakeCollectionFilter]
        rerender()
      })

      it('does render method library filters', () => {
        expect(wrapper.find('MethodLibraryFilterBar').exists()).toBe(true)
      })
    })
  })

  describe('onCreateFilter()', () => {
    const fireEvent = (filterLookupType, tagText) => {
      wrapper.instance().currentFilterLookupType = filterLookupType
      wrapper.instance().onCreateFilter({
        name: tagText,
      })
    }

    describe('with the filter type set to search', () => {
      beforeEach(() => {
        fireEvent('Search Term', 'animals')
      })

      it('should call API_createCollectionFilter with transformed filter', () => {
        expect(
          props.collection.API_createCollectionFilter
        ).toHaveBeenCalledWith({
          text: 'animals',
          filter_type: 'search',
          selected: false,
        })
      })
    })

    describe('with the filter type set to tags', () => {
      beforeEach(() => {
        fireEvent('Tags', 'dogs')
      })

      it('should call API_createCollectionFilter with transformed filter', () => {
        expect(
          props.collection.API_createCollectionFilter
        ).toHaveBeenCalledWith({
          text: 'dogs',
          filter_type: 'tag',
          selected: false,
        })
      })
    })

    describe('adding duplicate tag', () => {
      beforeEach(() => {
        props.collection.API_createCollectionFilter.mockClear()
        props.collection.collection_filters = [fakeCollectionFilter]
        fireEvent('Tags', fakeCollectionFilter.text)
      })

      it('does not call API_createCollectionFilter if filter is dupe', () => {
        expect(
          props.collection.API_createCollectionFilter
        ).not.toHaveBeenCalled()
      })
    })

    describe('with the filter type set to null', () => {
      beforeEach(() => {
        props.collection.API_createCollectionFilter.mockClear()
        fireEvent(null, 'dogs')
      })

      it('should not do anything', () => {
        expect(
          props.collection.API_createCollectionFilter
        ).not.toHaveBeenCalled()
      })
    })
  })

  describe('onDeleteFilter()', () => {
    describe('if the tag matches a filter', () => {
      let filter

      beforeEach(() => {
        filter = fakeCollectionFilter
        apiStore.find.mockReset()
        apiStore.find.mockReturnValue(fakeCollectionFilter)
        wrapper.instance().onDeleteFilter({
          id: '1',
        })
      })

      it('should call API_destroyCollectionFilter with the filter', () => {
        expect(
          props.collection.API_destroyCollectionFilter
        ).toHaveBeenCalledWith(filter)
      })

      it('should refetch collection cards', () => {
        expect(props.collection.API_fetchCards).toHaveBeenCalled()
      })
    })

    describe('if the tag does not match a filter', () => {
      beforeEach(() => {
        props.collection.API_destroyCollectionFilter.mockClear()
        apiStore.find.mockReset()
        apiStore.find.mockReturnValue(null)
        wrapper.instance().onDeleteFilter({ id: '1' })
      })

      it('should do nothing', () => {
        expect(
          props.collection.API_destroyCollectionFilter
        ).not.toHaveBeenCalled()
      })
    })
  })

  describe('onSelectFilter()', () => {
    describe('if the tag matches a filter', () => {
      let filter

      beforeEach(() => {
        filter = fakeCollectionFilter
        apiStore.find.mockReset()
        apiStore.find.mockReturnValue(fakeCollectionFilter)
        wrapper.instance().onSelectFilter({
          id: '1',
        })
      })

      it('should call API_toggleSelected with selected desired state', () => {
        expect(filter.API_toggleSelected).toHaveBeenCalledWith(collection, true)
      })

      it('should refetch collection cards', () => {
        expect(props.collection.API_fetchCards).toHaveBeenCalled()
      })
    })
  })

  describe('onShowAll()', () => {
    const filters = []

    beforeEach(() => {
      filters.push(Object.assign({}, fakeCollectionFilter, { id: '5' }))
      filters.push(Object.assign({}, fakeCollectionFilter, { id: '6' }))
      props.collection.collection_filters = filters
      rerender()
      wrapper.instance().onShowAll()
    })

    it('should de-select all the current filters', () => {
      filters.forEach(filter => {
        expect(filter.API_toggleSelected).toHaveBeenCalledWith(
          collection,
          false
        )
        expect(filter.API_toggleSelected).toHaveBeenCalledWith(
          collection,
          false
        )
      })
    })

    it('should refetch collection cards', () => {
      expect(props.collection.API_fetchCards).toHaveBeenCalled()
    })
  })
})
