import ActivityLogBox, { POSITION_KEY, PAGE_KEY } from '~/ui/activity_log/ActivityLogBox'
import localStorage from 'mobx-localstorage'

import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'

jest.mock('mobx-localstorage')
jest.mock('mobx')

describe('ActivityLogBox', () => {
  let props, wrapper, component, localStorageStore
  const fakeEv = { preventDefault: jest.fn() }

  beforeEach(() => {
    const apiStore = fakeApiStore()
    const uiStore = fakeUiStore

    // Setup fake local storage
    localStorageStore = {}
    localStorage.setItem = (key, val) => {
      localStorageStore[key] = val
    }
    localStorage.getItem = (key) => localStorageStore[key]
    props = { uiStore, apiStore }
    localStorage.clear()
    document.body.innerHTML = '<div class="Grid"></div>'
    wrapper = shallow(
      <ActivityLogBox.wrappedComponent {...props} />
    )
    component = wrapper.instance()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('handleClose()', () => {
    it('should close the activity log in the UI store', () => {
      props.uiStore.update('activityLogOpen', true)
      component.handleClose(fakeEv)
      expect(props.uiStore.activityLogOpen).toBeFalsy()
    })
  })

  describe('componentDidMount()', () => {
    it('should set the position based with defaults if not set', () => {
      expect(component.position.x).toEqual(0)
      expect(component.position.y).toEqual(180)
    })

    it('should set current page to default comments page', () => {
      expect(component.currentPage).toEqual('comments')
    })

    describe('with an existing position set in local storage', () => {
      let pos

      beforeEach(() => {
        pos = { x: 2, y: 3, h: 4, w: 5 }
        localStorage.setItem(POSITION_KEY, pos)
        localStorage.setItem(PAGE_KEY, 'notifications')
        wrapper = shallow(
          <ActivityLogBox.wrappedComponent {...props} />
        )
        component = wrapper.instance()
      })

      it('should use the position value from local storage', () => {
        expect(component.position).toEqual(pos)
      })

      it('should use the page value from local storage', () => {
        expect(component.currentPage).toEqual('notifications')
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
      expect(localStorage.getItem(POSITION_KEY)).toEqual(pos)
    })

    describe('when just the x and y are given', () => {
      beforeEach(() => {
        component.position = { x: 10, y: 15, w: 1, h: 2 }
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

    afterEach(() => {
      component.currentPage = 'comments'
    })

    it('should update the currentPage', () => {
      expect(component.currentPage).toEqual('notifications')
    })

    it('should set the local storage key for page', () => {
      expect(localStorage.getItem(PAGE_KEY)).toEqual('notifications')
    })
  })
})
