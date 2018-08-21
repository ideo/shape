import GlobalSearch from '~/ui/layout/GlobalSearch'
import fakeUiStore from '#/mocks/fakeUiStore'

let props, wrapper, component
describe('GlobalSearch', () => {
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
      <GlobalSearch.wrappedComponent {...props} />
    )
    component = wrapper.instance()
  })

  it('updates the uiStore on text change', () => {
    const ev = { target: { value: 'hello' } }
    component.handleTextChange(ev.target.value)
    expect(props.uiStore.update).toHaveBeenCalledWith('searchText', ev.target.value)
  })
})
