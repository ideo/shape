import { clone } from 'lodash'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeUser } from '#/mocks/data'
import AdminUsersModal from '~/ui/admin/AdminUsersModal'

describe('AdminUsersModal', () => {
  let props, wrapper, component, rerender, apiStore, uiStore, adminUser
  beforeEach(() => {
    adminUser = clone(fakeUser)

    apiStore = fakeApiStore()
    apiStore.shapeAdminUsers = [fakeUser]

    uiStore = fakeUiStore

    props = {
      apiStore,
      uiStore,
    }

    rerender = props => {
      wrapper = shallow(<AdminUsersModal.wrappedComponent {...props} />)
      component = wrapper.instance()
    }
    rerender(props)
  })

  it('does not show the list of pending admin users if there are none', () => {
    expect(wrapper.find('Panel').length).toEqual(1)
  })

  it('shows the list of active admin users', () => {
    const activePanel = wrapper.find('Panel')
    expect(activePanel.exists()).toBe(true)

    const panelProps = activePanel.props()
    expect(panelProps.open).toBe(true)
    expect(panelProps.title).toEqual('Active Users (1)')
  })

  describe('with pending admin users', () => {
    beforeEach(() => {
      const pendingAdminUser = clone(fakeUser)
      pendingAdminUser.status = 'pending'
      pendingAdminUser.isCurrentUser = false

      apiStore.shapeAdminUsers.push(pendingAdminUser)

      rerender(props)
    })

    it('shows the list of pending admin users', () => {
      const panels = wrapper.find('Panel')
      expect(panels.length).toEqual(2)

      const pendingPanel = panels.first()
      const panelProps = pendingPanel.props()
      expect(panelProps.open).toBe(false)
      expect(panelProps.title).toEqual('Pending Invitations (1)')
    })
  })

  describe('handleRemoveUserClick', () => {
    describe('with current user', () => {
      it('shows a confirmation asking if they want to leave Shape Admin', () => {
        const confirmParams = {
          prompt: 'Are you sure you want to leave Shape Admin?',
          confirmText: 'Leave',
          iconName: 'Leave',
          onConfirm: expect.any(Function),
        }

        component.handleRemoveUserClick(adminUser)
        expect(uiStore.confirm).toHaveBeenCalledWith(confirmParams)
      })
    })

    describe('not with current user', () => {
      it('shows a confirmation asking if they want to remove the Shape Admin', () => {
        adminUser.isCurrentUser = false

        const confirmParams = {
          prompt: `Are you sure you want to remove ${adminUser.name} from Shape Admin?`,
          confirmText: 'Remove',
          iconName: 'Leave',
          onConfirm: expect.any(Function),
        }

        component.handleRemoveUserClick(adminUser)
        expect(uiStore.confirm).toHaveBeenCalledWith(confirmParams)
      })
    })
  })

  describe('removeUser', () => {
    it('makes a call to remove Shape admin user', () => {
      component.removeUser(adminUser)
      expect(apiStore.removeShapeAdminUser).toHaveBeenCalledWith(adminUser)
    })
  })

  describe('createRoles', () => {
    xit('makes a call to add Shape admim users', () => {
      const newUsers = [clone(fakeUser)]
      const opts = { sendInvites: true }
      component.createRoles(newUsers, null, opts)
      expect(apiStore.addShapeAdminUsers).toHaveBeenCalledWith(newUsers, opts)
    })
  })

  describe('createUsers', () => {
    xit('makes a call to create users', () => {
      const emails = ['test@test.com']
      component.createUsers(emails)
      expect(apiStore.request).toHaveBeenCalledWith(
        'users/create_from_emails',
        'POST',
        { emails }
      )
    })
  })
})
