import localStorage from 'mobx-localstorage'
import ActivityLogBox from '~/ui/activity_log/ActivityLogBox'
import {
  ACTIVITY_LOG_PAGE_KEY,
  ACTIVITY_LOG_POSITION_KEY,
} from '~/utils/variables'

import { fakeCollection, fakeNotification } from '#/mocks/data'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'

jest.mock('mobx-localstorage')

describe('ActivityLogBox', () => {
  let props, wrapper, component, localStorageStore, reRender
  const fakeEv = { preventDefault: jest.fn() }

  beforeEach(() => {
    const apiStore = fakeApiStore()
    const uiStore = fakeUiStore

    // Setup fake local storage
    localStorageStore = {}
    localStorage.setItem = (key, val) => {
      localStorageStore[key] = val
    }
    localStorage.getItem = key => localStorageStore[key]
    props = { uiStore, apiStore }
    uiStore.update.mockClear()
    localStorage.clear()
    document.body.innerHTML = '<div class="Grid"></div>'
    reRender = function() {
      wrapper = shallow(<ActivityLogBox.wrappedComponent {...props} />)
      component = wrapper.instance()
    }
    reRender()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('render()', () => {
    beforeEach(() => {
      props.uiStore.activityLogOpen = true
      props.apiStore.unreadNotificationsCount = 2
      props.apiStore.unreadNotifications = [fakeNotification, fakeNotification]
      props.apiStore.unreadCommentsCount = 1
      reRender()
    })

    it('should show the unread comments and notifications', () => {
      expect(wrapper.find('ActivityCount').exists()).toBeTruthy()
      expect(wrapper.find('ActivityCount').length).toEqual(2)
    })

    it('should not show the test action', () => {
      const testAction = wrapper.find('.liveTest')
      expect(testAction.exists()).toBe(false)
    })

    describe('with no unread comments or notifications', () => {
      beforeEach(() => {
        props.apiStore.unreadNotificationsCount = 0
        props.apiStore.unreadNotifications = []
        props.apiStore.unreadCommentsCount = 0
        reRender()
      })

      it('should not show the activity count', () => {
        expect(wrapper.find('ActivityCount').exists()).toBeFalsy()
      })
    })

    describe('with a viewing collection with a live test', () => {
      beforeEach(() => {
        const collectionWithTest = Object.assign({}, fakeCollection, {
          liveTestCollectionId: '100',
        })
        props.uiStore.viewingCollection = collectionWithTest
        reRender()
      })

      it('should show the tests action', () => {
        const testAction = wrapper.find('.liveTest')
        expect(testAction.exists()).toBe(true)
      })
    })
  })

  describe('handleClose()', () => {
    it('should close the activity log in the UI store', () => {
      props.uiStore.update('activityLogOpen', true)
      component.handleClose(fakeEv)
      expect(props.uiStore.update).toHaveBeenCalledWith(
        'activityLogOpen',
        false
      )
    })
  })

  describe('componentDidMount()', () => {
    it('should set the position based with defaults if not set', () => {
      expect(component.position.x).toEqual(0)
      expect(component.position.y).toEqual(180)
    })

    describe('with an existing position set in local storage', () => {
      let pos

      beforeEach(() => {
        pos = { x: 2, y: 3, h: 4, w: 5 }
        localStorage.setItem(ACTIVITY_LOG_POSITION_KEY, pos)
        localStorage.setItem(ACTIVITY_LOG_PAGE_KEY, 'notifications')
        wrapper = shallow(<ActivityLogBox.wrappedComponent {...props} />)
        component = wrapper.instance()
      })

      it('should use the position value from local storage', () => {
        expect(component.position).toEqual(pos)
      })

      it('should update uiStore with the page value from local storage', () => {
        expect(props.uiStore.setActivityLogPage).toHaveBeenCalledWith(
          'notifications'
        )
      })
    })
  })

  describe('updatePosition', () => {
    let pos

    beforeEach(() => {
      pos = { x: 5, y: 5, w: 100, h: 100 }
      component.updatePosition(pos)
    })

    it('should update the position x and y', () => {
      expect(component.position).toEqual(pos)
    })

    it('should update the local storage key', () => {
      expect(localStorage.getItem(ACTIVITY_LOG_POSITION_KEY)).toEqual(pos)
    })

    describe('when just the x and y are given', () => {
      beforeEach(() => {
        // first store the values
        component.updatePosition({ x: 10, y: 15, w: 1, h: 2 })
        // then update
        pos = { x: 5, y: 5 }
        component.updatePosition(pos)
      })

      it('should update the x and y, keep the w and h to previous vals', () => {
        expect(component.position.x).toEqual(pos.x)
        expect(component.position.y).toEqual(pos.y)
        expect(component.position.w).toEqual(1)
        expect(component.position.h).toEqual(2)
      })
    })
  })

  describe('changePage', () => {
    beforeEach(() => {
      component.changePage('notifications')
    })

    it('should update the currentPage in uiStore', () => {
      expect(props.uiStore.setActivityLogPage).toHaveBeenCalledWith(
        'notifications'
      )
    })
  })

  describe('renderComments', () => {
    beforeEach(() => {
      component.changePage('comments')
    })

    it('should render a CommentThreadContainer with loadingThreads prop', () => {
      const ctc = wrapper.find('CommentThreadContainer')
      expect(ctc.exists()).toBeTruthy()
      expect(ctc.props().loadingThreads).toEqual(props.apiStore.loadingThreads)
    })
  })

  describe('handleMoveStart', () => {
    it('should update uiStore activityLogMoving', () => {
      component.handleMoveStart()
      expect(fakeUiStore.update).toHaveBeenCalledWith('activityLogMoving', true)
    })
  })

  describe('handleMoveStop', () => {
    it('should disable uiStore activityLogMoving', () => {
      component.handleMoveStop()
      expect(fakeUiStore.update).toHaveBeenCalledWith(
        'activityLogMoving',
        false
      )
    })
  })

  describe('overrideProps', () => {
    beforeEach(() => {
      props.uiStore.isTouchDevice = true
      reRender()
    })

    it('disables resizing and dragging', () => {
      const { overrideProps } = component

      expect(overrideProps.disableDragging).toEqual(true)
      expect(overrideProps.enableResizing).toEqual({})
    })
  })

  describe('render', () => {
    it('renders <Rnd/> component with activity_log-draggable className', () => {
      expect(
        wrapper.find('Rnd').hasClass('activity_log-draggable')
      ).toBeTruthy()
    })
  })
})
