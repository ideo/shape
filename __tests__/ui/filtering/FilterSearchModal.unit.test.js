import FilterSearchModal from '~/ui/filtering/FilterSearchModal'

import { fakeCollectionFilter } from '#/mocks/data'

jest.mock('../../../app/javascript/stores/index')

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
    rerender = function() {
      wrapper = shallow(<FilterSearchModal {...props} />)
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

    describe('when modal is open with filter type', () => {
      beforeEach(() => {
        props.modalOpen = true
        props.filterType = 'Tags'
        props.filters = [fakeCollectionFilter]
        rerender()
      })

      it('should have the Modal open', () => {
        const modal = wrapper.find('Modal')
        expect(modal.exists()).toBe(true)
        expect(modal.props().open).toBe(true)
      })

      it('formats the filters as tags', () => {
        const reactTags = wrapper.find('ReactTags')
        console.log(reactTags.props())
        const tagProp = reactTags.props().tags[0]
        expect(tagProp.id).toEqual(fakeCollectionFilter.id)
        expect(tagProp.name).toEqual(fakeCollectionFilter.text)
      })
    })
  })
})
