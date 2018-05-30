import CommentThreadContainer from '~/ui/threads/CommentThreadContainer'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'

let wrapper, props, component, apiStore, uiStore
describe('CommentThreadContainer', () => {
  beforeEach(() => {
    apiStore = fakeApiStore()
    uiStore = fakeUiStore

    props = {
      uiStore,
      apiStore,
    }
    wrapper = shallow(
      <CommentThreadContainer.wrappedComponent {...props} />
    )
    component = wrapper.instance()
  })

  it('renders a CommentThread for each of apiStore.currentThreads', () => {
    expect(wrapper.find('CommentThread').exists()).toBeTruthy()
    expect(wrapper.find('CommentThread').length).toEqual(apiStore.currentThreads.length)
  })

  it('can toggle a thread being expanded', () => {
    const key = 'abc123'
    component.expandThread({ key })()
    expect(uiStore.expandThread).toHaveBeenCalledWith(key)
  })
})
