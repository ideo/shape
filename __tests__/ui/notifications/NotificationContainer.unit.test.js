import NotificationsContainer from '~/ui/notifications/NotificationsContainer'

import fakeApiStore from '#/mocks/fakeApiStore'

let props
let wrapper
let component

describe('NotificationsContainer', () => {
  beforeEach(() => {
    props = {
      apiStore: fakeApiStore(),
    }
    wrapper = shallow(<NotificationsContainer.wrappedComponent {...props} />)
    component = wrapper.instance()
  })

  describe('unreadCount', () => {
    beforeEach(() => {
      props.apiStore = fakeApiStore()
      props.apiStore.unreadNotifications = [
        { id: 1, read: false },
        { id: 2, read: false },
        { id: 3, read: true },
      ]
      props.apiStore.unreadNotificationsCount = 2
      wrapper.setProps(props)
    })

    it('it should return the amount of unread notifications', () => {
      expect(component.unreadCount()).toEqual(2)
    })
  })

  describe('notifications', () => {
    let notifications

    beforeEach(() => {
      props.apiStore.notifications = [
        { id: 1, read: false, created_at: new Date('May 4 1977 12:30') },
        { id: 2, read: false, created_at: new Date('April 20 2017 12:30') },
        { id: 3, read: true, created_at: new Date() },
      ]
      wrapper.setProps(props)
      ;({ notifications } = component)
    })

    it('should order by read and created at', () => {
      expect(notifications[0].id).toEqual(2)
      expect(notifications[1].id).toEqual(1)
      expect(notifications[2].id).toEqual(3)
    })
  })
})
