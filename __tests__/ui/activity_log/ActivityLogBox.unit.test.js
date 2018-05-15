import ActivityLogBox, { LOCAL_STORAGE_KEY } from '~/ui/activity_log/ActivityLogBox'

import fakeUiStore from '#/mocks/fakeUiStore'

describe('ActivityLogBox', () => {
  let props, wrapper, component
  const fakeEv = { preventDefault: jest.fn() }

  beforeEach(() => {
    const uiStore = fakeUiStore
    props = { uiStore }
    localStorage.clear();
    wrapper = shallow(
      <ActivityLogBox.wrappedComponent {...props} />
    )
    component = wrapper.instance()
  })

  describe('handleClose()', () => {
    it('should close the activity log in the UI store', () => {
      props.uiStore.update('activityLogOpen', true)
      component.handleClose(fakeEv)
      expect(props.uiStore.activityLogOpen).toBeFalsy()
    })
  })

  describe('componentDiMount()', () => {
    it('should set the position based with defaults if not set', () => {
      expect(component.position.x).toEqual(0)
      expect(component.position.y).toEqual(83)
    })
  })

  describe('updatePosition', () => {
    let pos

    beforeEach(() => {
      pos = { x: 5, y: 5 }
      component.updatePosition(pos)
    })

    it('should update the position', () => {
      expect(component.position).toEqual(pos)
    })

    it('should update the local storage key', () => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        LOCAL_STORAGE_KEY,
        JSON.stringify(pos)
      )
    })
  })
})
