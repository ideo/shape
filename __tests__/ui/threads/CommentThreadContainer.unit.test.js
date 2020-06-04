import CommentThreadContainer from '~/ui/threads/CommentThreadContainer'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'
import { fakeCollection } from '#/mocks/data'

jest.mock('react-scroll')

let wrapper, props, component, apiStore, uiStore, currentThread
describe('CommentThreadContainer', () => {
  beforeEach(() => {
    apiStore = fakeApiStore()
    uiStore = fakeUiStore
    uiStore.viewingRecord = fakeCollection

    props = {
      uiStore,
      apiStore,
      loadingThreads: false,
      updateContainerSize: () => null,
    }
    wrapper = shallow(<CommentThreadContainer.wrappedComponent {...props} />)
    component = wrapper.instance()
  })

  describe('componentDidUpdate', () => {
    it('should set expandedThread if expanded', () => {
      wrapper.setProps({
        loadingThreads: false,
        uiStore: {
          ...fakeUiStore,
          expandedThreadKey: apiStore.currentThreads[0].key,
        },
      })
      wrapper.update()
      component = wrapper.instance()
      expect(component.expandedThread).toEqual(apiStore.currentThreads[0])
    })
  })

  it('renders a CommentThreadHeader for each of apiStore.currentThreads', () => {
    expect(wrapper.find('CommentThreadHeader').exists()).toBeTruthy()
    expect(wrapper.find('CommentThreadHeader').length).toEqual(
      apiStore.currentThreads.length
    )
  })

  it('renders the jump button to jump to the current thread', () => {
    expect(component.showJumpButton).toBe(true)
    expect(wrapper.find('JumpButton').exists()).toBe(true)
  })

  it('can toggle a thread being expanded', () => {
    const key = 'abc123'
    component.expandThread({ key })()
    expect(uiStore.expandThread).toHaveBeenCalledWith(key, { reset: false })
  })

  describe('with styles', () => {
    beforeEach(() => {
      wrapper = mount(<CommentThreadContainer.wrappedComponent {...props} />)
    })
    it('should render the ActivityContainer with moving=false to enable overflow-y scroll', () => {
      expect(wrapper.find('ActivityContainer').props().moving).toBe(false)
      expect(wrapper.find('ActivityContainer')).toHaveStyleRule(
        'overflow-y',
        'scroll'
      )
    })

    describe('while uiStore.activityLogMoving is true', () => {
      beforeEach(() => {
        props.uiStore.activityLogMoving = true
        wrapper = mount(<CommentThreadContainer.wrappedComponent {...props} />)
      })

      it('should render the ActivityContainer with moving=true to disable overflow-y', () => {
        expect(wrapper.find('ActivityContainer').props().moving).toBe(true)
        expect(wrapper.find('ActivityContainer')).toHaveStyleRule(
          'overflow-y',
          'hidden'
        )
      })
    })
  })

  describe('loadMorePages', () => {
    beforeEach(() => {
      wrapper.setProps({ apiStore: { ...apiStore, hasOlderThreads: true } })
    })
    it('should render "Load older threads" button if more threads available', () => {
      expect(wrapper.find('ShowMoreButton').exists()).toBeTruthy()
    })

    it('should close expanded thread and call apiStore.loadNextThreadPage', () => {
      component.loadMorePages()
      expect(props.uiStore.expandThread).toHaveBeenCalledWith(null)
      expect(props.apiStore.loadNextThreadPage).toHaveBeenCalled()
    })
  })

  describe('when on page of expanded thread', () => {
    beforeEach(() => {
      currentThread = apiStore.currentThreads[0]
      currentThread.record = fakeCollection
      wrapper.setProps({
        loadingThreads: false,
        uiStore: {
          ...fakeUiStore,
          viewingRecord: fakeCollection,
          expandedThreadKey: currentThread.key,
        },
      })
      wrapper.update()
      component = wrapper.instance()
    })

    it('should render a CommentThread for the thread', () => {
      const commentThread = wrapper.find('CommentThread')
      expect(commentThread.length).toEqual(1)
      expect(commentThread.props().thread).toEqual(currentThread)
    })

    it('should not show the jump button', () => {
      expect(component.showJumpButton).toBe(false)
      expect(wrapper.find('JumpButton').exists()).toBe(false)
    })
  })
})
