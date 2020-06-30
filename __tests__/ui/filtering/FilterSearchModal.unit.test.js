import FilterSearchModal from '~/ui/filtering/FilterSearchModal'

import { fakeCollectionFilter, fakeOrganization } from '#/mocks/data'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

jest.useFakeTimers()

let wrapper, rerender, props, filters, currentOrganization

const mockTagResponse = nameArray => {
  return {
    data: nameArray.map((name, i) => {
      return {
        id: i.toString(),
        type: 'tags',
        attributes: {
          name,
        },
      }
    }),
  }
}

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
      apiStore: fakeApiStore(),
      uiStore: fakeUiStore,
    }
    props.uiStore.viewingCollection = { id: '3' }
    currentOrganization = fakeOrganization
    props.apiStore.currentUserOrganization = currentOrganization
    rerender = function() {
      wrapper = shallow(<FilterSearchModal.wrappedComponent {...props} />)
      return wrapper
    }
    rerender()
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
  })

  describe('onInputChange()', () => {
    describe('if the input is more than 4 chars with filterType Tags', () => {
      beforeEach(() => {
        props.modalOpen = true
        props.filterType = 'Tags'
        props.filters = [fakeCollectionFilter]
        currentOrganization.searchTagsAndUsers = jest
          .fn()
          .mockReturnValue(mockTagResponse(['taco', 'tacocat']))
        rerender()
        wrapper.instance().onInputChange('taco')
        jest.advanceTimersByTime(600)
      })

      // The advance timer code isn't working yet.
      xit('should load the current organizations tag list', () => {
        expect(currentOrganization.searchTagsAndUsers).toHaveBeenCalled()
      })

      xit('should set the tagNames', () => {
        expect(wrapper.instance().suggestions.length).toBe(2)
      })

      xit('should format and pass any possible suggestions', () => {
        const reactTags = wrapper.find('ReactTags')
        const { suggestions } = reactTags.props()
        expect(suggestions.length).toEqual(2)
      })

      xit('should have the Modal open', () => {
        const modal = wrapper.find('Modal')
        expect(modal.exists()).toBe(true)
        expect(modal.props().open).toBe(true)
      })

      xit('formats the filters as tags', () => {
        const reactTags = wrapper.find('ReactTags')
        const tagProp = reactTags.props().tags[0]
        expect(tagProp.id).toEqual(fakeCollectionFilter.id)
        expect(tagProp.name).toEqual(fakeCollectionFilter.text)
      })

      xit('should format and pass any possible suggestions', () => {
        const reactTags = wrapper.find('ReactTags')
        const { suggestions } = reactTags.props()
        expect(suggestions.length).toEqual(2)
        expect(suggestions[0]).toEqual({ id: null, name: 'whale' })
      })
    })

    describe('if the input is more than 4 chars', () => {
      beforeEach(() => {
        props.filterType = 'Search Term'
        rerender()
        wrapper.instance().onInputChange('president')
        jest.advanceTimersByTime(600)
      })

      // The advance timer code isn't working yet.
      xit('should run a collection_card search', () => {
        expect(this.props.apiStore.request).toHaveBeenCalled()
        expect(this.props.apiStore.request).toHaveBeenCalledWith(
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
