import Notification from '~/ui/notifications/Notification'
import v from '~/utils/variables'
import sleep from '~/utils/sleep'
import { apiStore } from '~/stores'

import {
  fakeNotification,
} from '#/mocks/data'

jest.mock('../../../app/javascript/stores')
jest.mock('../../../app/javascript/utils/sleep')

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

  describe('componentDidMount', () => {
    it('should set fade in progress to false', () => {
      expect(component.fadeInProgress).toBeFalsy()
    })

    it('should set shown to true', () => {
      expect(component.shown).toBeTruthy()
    })
  })

  describe('handleRead', () => {
    beforeEach(() => {
      wrapper.find('.read').simulate('click', { preventDefault: jest.fn() })
    })

    it('should set the notification to read', () => {
      expect(fakeNotification.read).toBeTruthy()
    })

    it('should set fade in progress to false', () => {
      expect(component.fadeInProgress).toBeFalsy()
    })
  })

  describe('render', () => {
    describe('with the alert style type', () => {
      beforeEach(() => {
        wrapper.setProps({ styleType: 'alert', ...props })
      })

      it('should show a close button rather then notification button', () => {
        expect(wrapper.find('CloseButton').exists()).toBeTruthy()
      })

      it('should should not render the date', () => {
        expect(wrapper.find('Moment').exists()).toBeFalsy()
      })

      it('should change the styles', () => {
        const ele = wrapper.find('StyledNotification')
        expect(ele).toHaveStyleRule(
          'background', v.colors.orange
        )
        expect(ele).toHaveStyleRule(
          'margin-right', '0px'
        )
      })
    })

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
