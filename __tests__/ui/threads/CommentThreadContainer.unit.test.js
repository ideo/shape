import CommentThreadContainer from '~/ui/threads/CommentThreadContainer'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'

import {
  fakeCollection,
} from '#/mocks/data'

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
    expect(uiStore.expandThread).toHaveBeenCalledWith(key, { reset: false })
  })

  describe('when on page of expanded thread', () => {
    beforeEach(() => {
      const thread = { id: 3, key: 'abc345', record: fakeCollection }
      uiStore.viewingRecord = fakeCollection
      const { key } = thread
      uiStore.expandedThreadKey = key
    })

    it('should not show the jump button', () => {
      expect(wrapper.find('.jumpToThread').exists()).toBeFalsy()
    })
  })
})
