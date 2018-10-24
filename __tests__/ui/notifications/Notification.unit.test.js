import Notification from '~/ui/notifications/Notification'
import v from '~/utils/variables'
import { apiStore } from '~/stores'

import { fakeNotification } from '#/mocks/data'

jest.mock('../../../app/javascript/stores')
jest.mock('../../../app/javascript/utils/sleep')

describe('Notification', () => {
  let props, wrapper, component, reRender, fakeData

  beforeEach(() => {
    fakeData = { name: '' }
    apiStore.fetch.mockReturnValue(Promise.resolve({ data: fakeData }))
    props = {
      notification: fakeNotification,
    }
    reRender = function() {
      wrapper = shallow(<Notification {...props} />)
      component = wrapper.instance()
    }
    reRender()
  })

  describe('componentWillMount', () => {
    it('should call apiStore.fetch to get the activity target, and set the target', () => {
      expect(apiStore.fetch).toHaveBeenCalledWith(
        'collections',
        fakeNotification.activity.target_id
      )
      expect(fakeNotification.activity.setTarget).toHaveBeenCalledWith(fakeData)
    })
  })
  describe('componentDidMount', () => {
    it('should set fade in progress to false', () => {
      expect(component.fadeInProgress).toBeFalsy()
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
        expect(ele).toHaveStyleRule('background', v.colors.alert)
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
