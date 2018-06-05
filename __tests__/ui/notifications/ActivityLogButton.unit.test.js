import ActivityLogButton from '~/ui/notifications/ActivityLogButton'
import { apiStore, uiStore } from '~/stores'

jest.mock('../../../app/javascript/stores')

let props
let wrapper
let component

describe('ActivityLogButton', () => {
  beforeEach(() => {
    props = {
    }
    wrapper = shallow(
      <ActivityLogButton {...props} />
    )
    component = wrapper.instance()
  })

  describe('render', () => {
    beforeEach(() => {
      apiStore.unreadActivityCount = 3
      wrapper = shallow(
        <ActivityLogButton {...props} />
      )
    })

    afterEach(() => {
      apiStore.unreadActivityCount = 0
    })

    it('should render the unread notifications and comments total', () => {
      const count = wrapper.find('.count')
      expect(count.exists()).toBeTruthy()
      expect(component.activityCount).toEqual(3)
    })
  })

  describe('handleComments', () => {
    const fakeEv = { preventDefault: jest.fn() }

    beforeEach(() => {
      uiStore.activityLogOpen = false
      wrapper.find('StyledCircledIcon').simulate('click', fakeEv)
    })

    it('should open the activity log in the ui store', () => {
      expect(uiStore.update).toHaveBeenCalledWith(
        'activityLogOpen', true
      )
    })
  })
})
