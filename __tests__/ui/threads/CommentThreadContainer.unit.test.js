import CommentThreadContainer from '~/ui/threads/CommentThreadContainer'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'

import { fakeCollection } from '#/mocks/data'

let wrapper, props, component, apiStore, uiStore
describe('CommentThreadContainer', () => {
  beforeEach(() => {
    apiStore = fakeApiStore()
    uiStore = fakeUiStore

    props = {
      uiStore,
      apiStore,
    }
    wrapper = shallow(<CommentThreadContainer.wrappedComponent {...props} />)
    component = wrapper.instance()
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
