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
        props.notification.combined_activities_ids = [2, 3]
        wrapper.setProps(props)
      })

      it('should return all the activity actors', () => {
        expect(component.combineActors()).toEqual(
          [{ id: 300 }, { id: 301 }]
        )
      })
    })
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
