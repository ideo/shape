import FilterSearchModal from '~/ui/filtering/FilterSearchModal'

import { apiStore, uiStore } from '~/stores'
import { fakeCollectionFilter } from '#/mocks/data'

jest.mock('../../../app/javascript/stores/index')
jest.useFakeTimers()

let wrapper, rerender, props, filters

describe('FilterSearchModal', () => {
  filters = []

  beforeEach(() => {
    filters = []
    props = {
      filters,
      onCreateTag: jest.fn(),
      onRemoveTag: jest.fn(),
      onSelectTag: jest.fn(),
      onModalClose: jest.fn(),
      filterType: null,
      modalOpen: false,
    }
    uiStore.viewingCollection = { id: '3' }
    rerender = function() {
      wrapper = shallow(<FilterSearchModal {...props} />)
      return wrapper
    }
    rerender()
  })

  describe('componentDidMount()', () => {
    beforeEach(() => {
      apiStore.requestJson.mockClear()
      apiStore.requestJson.mockReturnValue(Promise.resolve(['taga', 'tage']))
      rerender()
    })

    it('should load the current collections direct tag list', () => {
      expect(apiStore.requestJson).toHaveBeenCalled()
    })

    it('should set the tagNames', () => {
      expect(wrapper.instance().tagNames.length).toBe(2)
    })
  })

  describe('render()', () => {
    describe('when modal is not open or filter type is not set', () => {
      it('should not render the Modal', () => {
        expect(wrapper.find('Modal').exists()).toBe(false)
        props.modalOpen = true
        rerender()
        expect(wrapper.find('Modal').exists()).toBe(false)
      })
    })

    describe('when modal is open with filter type', () => {
      beforeEach(() => {
        props.modalOpen = true
        props.filterType = 'Tags'
        props.filters = [fakeCollectionFilter]
        apiStore.requestJson.mockClear()
        apiStore.requestJson.mockReturnValue(
          Promise.resolve(['whale', 'dolphin'])
        )
        rerender()
      })

      it('should have the Modal open', () => {
        const modal = wrapper.find('Modal')
        expect(modal.exists()).toBe(true)
        expect(modal.props().open).toBe(true)
      })

      it('formats the filters as tags', () => {
        const reactTags = wrapper.find('ReactTags')
        const tagProp = reactTags.props().tags[0]
        expect(tagProp.id).toEqual(fakeCollectionFilter.id)
        expect(tagProp.name).toEqual(fakeCollectionFilter.text)
      })

      it('should format and pass any possible suggestions', () => {
        const reactTags = wrapper.find('ReactTags')
        const { suggestions } = reactTags.props()
        expect(suggestions.length).toEqual(2)
        expect(suggestions[0]).toEqual({ id: null, name: 'whale' })
      })
    })
  })

  describe('onInputChange()', () => {
    describe('if the input is more than 4 chars', () => {
      beforeEach(() => {
        props.filterType = 'Search Term'
        rerender()
        wrapper.instance().onInputChange('president')
        jest.advanceTimersByTime(600)
      })

      // The advance timer code isn't working yet.
      xit('should run a collection_card search', () => {
        expect(apiStore.request).toHaveBeenCalled()
        expect(apiStore.request).toHaveBeenCalledWith(
          `collections/3/collection_cards?q=president`
        )
      })
    })

    describe('if the input is less than 4 chars', () => {
      beforeEach(() => {
        props.filterType = 'Search Term'
        rerender()
        wrapper.instance().searchResultCount = 5
        wrapper.instance().onInputChange('pre')
      })

      it('should clear the search result count to null', () => {
        expect(wrapper.instance().searchResultCount).toBeNull()
      })
    })
  })
})
