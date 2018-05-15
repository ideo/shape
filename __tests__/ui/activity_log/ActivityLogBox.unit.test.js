import ActivityLogBox from '~/ui/activity_log/ActivityLogBox'

import fakeUiStore from '#/mocks/fakeUiStore'

describe('ActivityLogBox', () => {
  let props, wrapper, component
  const fakeEv = { preventDefault: jest.fn() }

  beforeEach(() => {
    const uiStore = fakeUiStore
    props = { uiStore }
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
})
