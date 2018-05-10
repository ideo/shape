import SearchBar from '~/ui/layout/SearchBar'
import fakeUiStore from '#/mocks/fakeUiStore'

let props, wrapper, component
describe('SearchBar', () => {
  beforeEach(() => {
    const routingStore = {
      pathTo: jest.fn(),
      routeTo: jest.fn(),
      pathContains: jest.fn(),
    }
    props = {
      routingStore,
      uiStore: fakeUiStore,
    }
    wrapper = shallow(
      <SearchBar.wrappedComponent {...props} />
    )
    component = wrapper.instance()
  })

  it('renders the search icon', () => {
    expect(wrapper.find('SearchIcon').exists()).toBeTruthy()
  })

  it('renders the close button when there is searchText', () => {
    props.uiStore.searchText = 'hello'
    wrapper = shallow(
      <SearchBar.wrappedComponent {...props} />
    )
    expect(wrapper.find('button.close').exists()).toBeTruthy()
  })

  it('updates the uiStore on text change', () => {
    const ev = { target: { value: 'hello' } }
    component.handleTextChange(ev)
    expect(props.uiStore.update).toHaveBeenCalledWith('searchText', ev.target.value)
  })
})
