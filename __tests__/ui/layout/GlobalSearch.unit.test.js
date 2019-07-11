import GlobalSearch from '~/ui/layout/GlobalSearch'
import fakeUiStore from '#/mocks/fakeUiStore'

let props, wrapper, component
describe('GlobalSearch', () => {
  beforeEach(() => {
    const routingStore = {
      pathTo: jest.fn(),
      routeTo: jest.fn(),
      pathContains: jest.fn(),
      extraSearchParams: {},
    }
    props = {
      routingStore,
      uiStore: fakeUiStore,
    }
    wrapper = shallow(<GlobalSearch.wrappedComponent {...props} />)
    component = wrapper.instance()
  })

  it('updates the uiStore on text change', () => {
    const ev = { target: { value: 'hello' } }
    component.handleTextChange(ev.target.value)
    expect(props.uiStore.update).toHaveBeenCalledWith(
      'searchText',
      ev.target.value
    )
  })

  describe('when searching archived content', () => {
    beforeEach(() => {
      component.searchArchived = true
    })

    it('should include search archived in the params', () => {
      component._search('hello')
      expect(props.routingStore.routeTo).toHaveBeenCalledWith(
        'search',
        'hello',
        { show_archived: true }
      )
    })
  })
})
