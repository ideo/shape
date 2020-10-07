import { clone } from 'lodash'

import RolesDialogActions from '~/ui/roles/RolesDialogActions'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeCollection, fakeUser } from '#/mocks/data'

let props, wrapper, rerender, component
describe('RolesDialogActions', () => {
  beforeEach(() => {
    const uiStore = fakeUiStore
    uiStore.createRoles = jest.fn()

    props = {
      apiStore: fakeApiStore(),
      uiStore: fakeUiStore,
      record: fakeCollection,
    }

    rerender = () => {
      wrapper = shallow(<RolesDialogActions.wrappedComponent {...props} />)
      component = wrapper.instance()
    }

    rerender()
  })

  it('should render RolesAdd', () => {
    expect(wrapper.find('RolesAdd').exists()).toBe(true)
  })

  describe('createUsers', () => {
    it('makes a call to create users', () => {
      const emails = ['test@test.com']
      component.createUsers(emails)
      expect(props.apiStore.request).toHaveBeenCalledWith(
        'users/create_from_emails',
        'POST',
        { emails }
      )
    })
  })

  describe('admin user context', () => {
    beforeEach(() => {
      props = {
        apiStore: fakeApiStore(),
        uiStore: fakeUiStore,
        context: 'admin',
      }

      rerender()
    })

    it('should render RolesAdd with shapeAdmins as the ownerType', () => {
      expect(wrapper.find('RolesAdd').exists()).toBe(true)
      expect(wrapper.find('RolesAdd').props().ownerType).toEqual('shapeAdmins')
      expect(wrapper.find('RolesAdd').props().roleTypes).toEqual(['shapeAdmin'])
    })

    describe('createRoles', () => {
      it('makes a call to create shape admin users', () => {
        const newUsers = [clone(fakeUser)]
        const opts = { sendInvites: true }
        component.createShapeAdminRoles(newUsers, null, opts)
        expect(props.apiStore.addShapeAdminUsers).toHaveBeenCalledWith(
          newUsers,
          opts
        )
      })
    })
  })
})
