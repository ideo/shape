import UserSettings from '~/ui/users/UserSettings'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import { fakeUser } from '#/mocks/data'
import v from '~/utils/variables'

let wrapper, component, apiStore, uiStore, routingStore
let props, organization

beforeEach(() => {
  apiStore = fakeApiStore()
  apiStore.currentUser = fakeUser
  uiStore = fakeUiStore
  routingStore = fakeRoutingStore
  organization = apiStore.currentUserOrganization
  props = { apiStore, uiStore, routingStore }
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

  describe('handleMailingListCheck', () => {
    const ev = { target: {} }

    describe('when unsubscribing', () => {
      beforeEach(() => {
        ev.target.checked = false
        component.handleMailingListCheck(ev)
      })

      it("unsets the user's mailing list preference", () => {
        expect(fakeUser.API_updateCurrentUser).toHaveBeenCalledWith({
          mailing_list: false,
        })
        expect(uiStore.alert).toHaveBeenCalled()
      })
    })

    beforeEach(() => {
      ev.target.checked = true
      component.handleMailingListCheck(ev)
    })

    it("sets the user's mailing list preference", () => {
      expect(fakeUser.API_updateCurrentUser).toHaveBeenCalledWith({
        mailing_list: true,
      })
      expect(uiStore.alert).toHaveBeenCalled()
    })
  })

  describe('handleAddToMyCollectionCheck', () => {
    const ev = { target: {} }

    describe('when choosing let me place it as default behavior for using templates', () => {
      beforeEach(() => {
        ev.target.checked = false
        component.handleAddToMyCollectionCheck(ev)
      })

      it("unsets the user's mailing list preference", () => {
        expect(fakeUser.API_updateUseTemplateSetting).toHaveBeenCalledWith(
          v.useTemplateSettings.letMePlaceIt
        )
      })
    })

    beforeEach(() => {
      ev.target.checked = true
      component.handleAddToMyCollectionCheck(ev)
    })

    it('when choosing let me place it as default behavior for using templates', () => {
      expect(fakeUser.API_updateUseTemplateSetting).toHaveBeenCalledWith(
        v.useTemplateSettings.addToMyCollection
      )
    })
  })
})
