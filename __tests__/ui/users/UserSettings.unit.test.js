import UserSettings from '~/ui/users/UserSettings'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeUser } from '#/mocks/data'

let wrapper, component, apiStore, uiStore, props, organization

beforeEach(() => {
  apiStore = fakeApiStore()
  apiStore.currentUser = fakeUser
  uiStore = fakeUiStore
  organization = apiStore.currentUserOrganization
  props = { apiStore, uiStore }
})

describe('UserSettings', () => {
  beforeEach(() => {
    organization.primary_group.can_edit = true
    wrapper = shallow(<UserSettings.wrappedComponent {...props} />)
    component = wrapper.instance()
  })

  describe('handleEmailNotifications', () => {
    const ev = {
      target: { value: 'on' },
      preventDefault: jest.fn(),
    }

    describe('when turning off', () => {
      beforeEach(() => {
        ev.target.value = 'off'
        component.handleEmailNotifications(ev)
      })

      it('shows a confirm modal if turning notifications off', () => {
        expect(uiStore.confirm).toHaveBeenCalled()
      })
    })

    beforeEach(() => {
      component.handleEmailNotifications(ev)
    })

    it('calls the current user api method to turn notifications off', () => {
      expect(fakeUser.API_updateCurrentUser).toHaveBeenCalled()
    })
  })
})
