import Notification from '~/ui/notifications/Notification'

import {
  fakeNotification,
} from '#/mocks/data'

describe('Notification', () => {
  let props
  let wrapper
  let component

  beforeEach(() => {
    props = {
      notification: fakeNotification
    }
    wrapper = shallow(
      <Notification {...props} />
    )
    component = wrapper.instance()
  })

  describe('componentDidMount', () => {
    it('should set the notification to read', () => {
      expect(fakeNotification.read).toBeTruthy()
    })
  })

  describe('combineActors', () => {
    beforeEach(() => {
      props.notification.combined_activities = []
      wrapper.setProps(props)
    })

    it('should return an array with just the activity actor', () => {
      expect(component.combineActors()).toEqual(
        [fakeNotification.activity.actor]
      )
    })

    describe('with combined activities', () => {
      beforeEach(() => {
        props.notification.combined_activities = [
          { id: 2, actor: { id: 300 } },
          { id: 3, actor: { id: 301 } },
        ]
        wrapper.setProps(props)
      })

      it('should return all the activity actors', () => {
        expect(component.combineActors()).toEqual(
          [{ id: 300 }, { id: 301 }]
        )
      })
    })
  })
})
