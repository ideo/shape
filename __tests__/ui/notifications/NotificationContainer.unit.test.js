import NotificationsContainer from '~/ui/notifications/NotificationsContainer'

import fakeApiStore from '#/mocks/fakeApiStore'
import {
  fakeNotification,
} from '#/mocks/data'

let props
let wrapper
let component

describe('NotificationsContainer', () => {
  beforeEach(() => {
    props = {
      apiStore: fakeApiStore(),
    }
    wrapper = shallow(
      <NotificationsContainer.wrappedComponent {...props} />
    )
    component = wrapper.instance()
  })

  describe('unreadCount', () => {
    beforeEach(() => {
      props.apiStore = fakeApiStore({
        findAllResult: [
          { id: 1, read: false },
          { id: 2, read: false },
          { id: 3, read: true },
        ]
      })
      wrapper.setProps(props)
    })

    it('it should return the amount of unread notifications', () => {
      expect(component.unreadCount()).toEqual(2)
    })
  })
})
