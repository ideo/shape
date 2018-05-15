import ActivityLogBox, { LOCAL_STORAGE_KEY } from '~/ui/activity_log/ActivityLogBox'

import fakeUiStore from '#/mocks/fakeUiStore'

describe('ActivityLogBox', () => {
  let props, wrapper, component
  const fakeEv = { preventDefault: jest.fn() }

  beforeEach(() => {
    const uiStore = fakeUiStore
    props = { uiStore }
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
      expect(component.position.x).toEqual(-319)
      expect(component.position.y).toEqual(83)
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
      expect(localStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEY,
        JSON.stringify(pos)
      )
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
})
