import Notification from '~/ui/notifications/Notification'

import { apiStore } from '~/stores'

import {
  fakeNotification,
} from '#/mocks/data'

jest.mock('../../../app/javascript/stores')

describe('Notification', () => {
  let props
  let wrapper
  let component
  let reRender

  beforeEach(() => {
    apiStore.fetch.mockReturnValue(Promise.resolve({ data: { name: '' } }))
    props = {
      notification: fakeNotification
    }
    reRender = function() {
      wrapper = shallow(
        <Notification {...props} />
      )
      component = wrapper.instance()
    }
    reRender()
  })

  describe('handleRead', () => {
    beforeEach(() => {
      wrapper.find('.read').simulate('click', { preventDefault: jest.fn() })
    })

    it('should set the notification to read', () => {
      expect(fakeNotification.read).toBeTruthy()
    })
  })

  describe('render', () => {
    describe('with a notification with no target yet', () => {
      beforeEach(() => {
        apiStore.find.mockReturnValue(null)
        props.notification.activity.target = null
        props.notification.activity.target_type = 'collections'
        props.notification.activity.target_id = 234
        reRender()
      })

      it('should show the inline loader', () => {
        expect(wrapper.find('InlineLoader').exists()).toBeTruthy()
      })
    })
  })
})
