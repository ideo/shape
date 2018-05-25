import Notification from '~/ui/notifications/Notification'

import {
  fakeNotification,
} from '#/mocks/data'

let props
let wrapper
let component

describe('Notification', () => {
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
})
