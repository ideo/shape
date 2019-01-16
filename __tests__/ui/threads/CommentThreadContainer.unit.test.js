import { scroller } from 'react-scroll'

import CommentThreadContainer from '~/ui/threads/CommentThreadContainer'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'
import { fakeCollection } from '#/mocks/data'

jest.mock('react-scroll')

let wrapper, props, component, apiStore, uiStore
describe('CommentThreadContainer', () => {
  beforeEach(() => {
    apiStore = fakeApiStore()
    uiStore = fakeUiStore

    props = {
      uiStore,
      apiStore,
      loadingThreads: false,
    }
    wrapper = shallow(<CommentThreadContainer.wrappedComponent {...props} />)
    component = wrapper.instance()
  })

  describe('componentDidMount', () => {
    it('should scroll to bottom if no threads are expanded', () => {
      expect(scroller.scrollTo).toHaveBeenCalledWith(
        `thread-${apiStore.currentThreads.length}`,
        {
          ...component.scrollOpts,
          delay: 0,
        }
      )
    })
  })

  describe('componentDidUpdate', () => {
    it('should set loadingThreads true', () => {
      wrapper.setProps({ loadingThreads: true })
      expect(component.loadingThreads).toEqual(true)
    })

    it('should set loadingThreads false and scrollToTopOfNextThread if expanded', () => {
      wrapper.setProps({
        loadingThreads: false,
        uiStore: {
          ...fakeUiStore,
          expandedThreadKey: apiStore.currentThreads[0].key,
        },
      })
      wrapper.update()
      component = wrapper.instance()
      expect(component.loadingThreads).toEqual(false)
      expect(component.expandedThread).toEqual(apiStore.currentThreads[0])
    })
  })

  it('renders a CommentThread for each of apiStore.currentThreads', () => {
    expect(wrapper.find('CommentThread').exists()).toBeTruthy()
    expect(wrapper.find('CommentThread').length).toEqual(
      apiStore.currentThreads.length
    )
  })

  it('can toggle a thread being expanded', () => {
    const key = 'abc123'
    component.expandThread({ key })()
    expect(uiStore.expandThread).toHaveBeenCalledWith(key, { reset: false })
  })

  it('should render the ActivityContainer with moving=false to enable overflow-y scroll', () => {
    expect(wrapper.find('ActivityContainer').props().moving).toBe(false)
    expect(wrapper.find('ActivityContainer')).toHaveStyleRule(
      'overflow-y',
      'scroll'
    )
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

  describe('when on page of expanded thread in view', () => {
    beforeEach(() => {
      component.visibileThreads = {
        get: jest.fn().mockReturnValue(true),
      }
      uiStore.viewingRecord = fakeCollection
    })

    it('should not show the jump button', () => {
      expect(component.showJumpToThreadButton).toBe(false)
    })
  })

  describe('while uiStore.activityLogMoving is true', () => {
    beforeEach(() => {
      props.uiStore.activityLogMoving = true
      wrapper = shallow(<CommentThreadContainer.wrappedComponent {...props} />)
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
