import RolesAdd from '~/ui/roles/RolesAdd'
import { apiStore, uiStore } from '~/stores'

jest.mock('../../../app/javascript/stores')

import { fakeGroup, fakeUser, fakeCollection } from '#/mocks/data'

const fakeUserAndGroupSearch = [
  {
    ...fakeUser,
    id: '19',
    status: 'archived',
  },
  {
    ...fakeUser,
    id: '20',
    status: 'active',
  },
  {
    ...fakeGroup,
  },
]

let props
let wrapper
let defaultOpts

describe('RolesAdd', () => {
  beforeEach(() => {
    props = {
      title: 'Add groups',
      searchableItems: [],
      roleTypes: ['viewer', 'editor'],
      roleLabels: {
        viewer: 'Viewer',
        editor: 'Editor',
        member: 'Member',
        admin: 'Admin',
      },
      onCreate: jest.fn(),
      onCreateUsers: jest.fn(),
      onCreateRoles: jest.fn(),
      onSearch: jest.fn(),
      ownerType: 'collections',
      addableGroups: [fakeGroup],
    }
    wrapper = mount(<RolesAdd {...props} />)
    defaultOpts = { sendInvites: true, addToGroupId: '' }
  })

  describe('constructor', () => {
    describe('when passing in a default group id', () => {
      beforeEach(() => {
        fakeCollection.default_group_id = '2'
        props.record = fakeCollection
        wrapper = mount(<RolesAdd {...props} />)
      })

      it('should set the selected group id to the default', () => {
        expect(wrapper.instance().selectedGroupId).toEqual('2')
        expect(wrapper.instance().syncedRoleTypes).toEqual(['admin', 'member'])
        expect(wrapper.instance().syncedRoleTypes).toContain('admin')
        expect(wrapper.instance().syncedRoleTypes).toContain('member')
        expect(wrapper.instance().selectedRole).toEqual('member')
      })
    })
  })

  describe('_autocompleteSearch', () => {
    // test the non-debounced function

    describe('with groups', () => {
      beforeEach(() => {
        apiStore.searchUsersAndGroups = jest
          .fn()
          .mockReturnValue(Promise.resolve({ data: fakeUserAndGroupSearch }))
        wrapper = mount(<RolesAdd {...props} ownerType="groups" />)
      })

      it('should call apiStore to search users and groups', async () => {
        const callback = jest.fn()
        const instance = wrapper.instance()
        // instance.mapItems = jest.fn()
        await instance._autocompleteSearch('person', callback)
        expect(apiStore.searchUsersAndGroups).toHaveBeenCalledWith({
          query: 'person',
        })
        // expect(instance.mapItems)
        expect(callback).toHaveBeenCalledWith(
          instance.mapItems([
            // the active user and group
            fakeUserAndGroupSearch[1],
            fakeUserAndGroupSearch[2],
          ])
        )
      })
    })

    describe('with collections', () => {
      beforeEach(() => {
        wrapper = mount(<RolesAdd {...props} ownerType="collections" />)
      })

      it('should call apiStore to search users and groups', () => {
        wrapper.instance()._autocompleteSearch('person', jest.fn())
        expect(apiStore.searchUsersAndGroups).toHaveBeenCalledWith({
          query: 'person',
        })
      })
    })
  })

  describe('onUserSelected', () => {
    let component

    beforeEach(() => {
      // Shortcut so this doesn't have to be found every time
      component = wrapper.instance()
    })

    describe('for a already registered user', () => {
      let userDataNew
      let userDataExisting

      beforeEach(() => {
        userDataNew = {
          id: '3',
          name: 'Mo',
          email: 'Mo@mo.com',
          internalType: 'users',
        }
        userDataExisting = {
          id: '4',
          name: 't',
          email: 't@t.t',
          internalType: 'users',
        }
        component.selectedUsers = [userDataExisting]
      })

      it('should add the user to the selectedUsers list if not there', () => {
        component.onUserSelected(userDataNew)
        component.onUserSelected(userDataExisting)
        expect(component.selectedUsers.length).toEqual(2)
      })
    })

    describe('for a new user', () => {
      const newUserData = { custom: 'm@m.com', internalType: 'users' }

      let existingUsers

      beforeEach(() => {
        existingUsers = [
          { name: 'r@r.com', email: 'r@r.com', internalType: 'users' },
        ]
        component.selectedUsers = existingUsers
      })

      it('should add the user with a name and email', () => {
        component.onUserSelected(newUserData)
        expect(component.selectedUsers[1]).toEqual({
          name: 'm@m.com',
          email: 'm@m.com',
          internalType: 'users',
        })
      })

      it('should not add the same email twice', () => {
        const anotherUser = { custom: 'r@r.com', internalType: 'users' }
        component.onUserSelected(anotherUser)
        expect(component.selectedUsers.length).toEqual(1)
      })

      it('should parse out emails from input', () => {
        component.onUserSelected({
          custom: '<jim> jim@email.com, jane@doe.net',
        })
        expect(component.selectedUsers.length).toEqual(3)
        expect(component.selectedUsers[1].email).toEqual('jim@email.com')
        expect(component.selectedUsers[2].email).toEqual('jane@doe.net')
      })

      it('should reject input that is not a valid email', () => {
        component.onUserSelected({ custom: '<jim>jim smith' })
        expect(component.selectedUsers.length).toEqual(1)
      })
    })
  })

  describe('mapItems', () => {
    describe('with groups', () => {
      it('should map groups with handle as the value', () => {
        const searchableItems = [
          {
            id: '3',
            name: 'groupname',
            handle: 'group-name',
            internalType: 'groups',
          },
        ]
        expect(wrapper.instance().mapItems(searchableItems)[0]).toEqual({
          value: 'group-name',
          label: 'groupname',
          data: searchableItems[0],
        })
      })
    })

    describe('with users', () => {
      it('should map users with email as the value', () => {
        const searchableItems = [
          { id: '3', name: 'user', email: 'user@u.com', internalType: 'users' },
        ]
        expect(wrapper.instance().mapItems(searchableItems)[0]).toEqual({
          value: 'user@u.com',
          label: 'user',
          data: searchableItems[0],
        })
      })
    })
  })

  describe('when selecting a group to add to', () => {
    let component
    let roleMenuItems, roleSelect

    beforeEach(() => {
      component = wrapper.instance()
      component.handleGroupSelect({ target: { value: fakeGroup.id } })
      wrapper.update()
      roleSelect = wrapper.find('[data-cy="permissionsRoleSelect"]').first()
    })

    it('should switch menu items to the group role types', () => {
      roleMenuItems = roleSelect.find('[data-cy="permissonsRoleLabel"]')
      expect(roleMenuItems.first().text()).toEqual('Member')
    })

    it('should auto select the member role type by default', () => {
      expect(roleSelect.props().value).toEqual('member')
    })
  })

  describe('handleSave', () => {
    let component
    let unregisteredUsers
    let registeredUsers

    beforeEach(() => {
      component = wrapper.instance()
      unregisteredUsers = [{ email: 'name@name.com' }, { email: 'mo@mo.com' }]
      registeredUsers = [
        { id: '4', email: 'm@ideo.com', name: 'm' },
        { id: '3', email: 't@ideo.com', name: 't' },
      ]
    })

    describe('with unregistered users', () => {
      beforeEach(() => {
        component.selectedUsers = unregisteredUsers
        props.onCreateUsers.mockReturnValue(
          Promise.resolve({ data: [{ id: '1' }] })
        )
      })

      it('should send the emails to be created', done => {
        component.handleSave().then(() => {
          expect(props.onCreateUsers).toHaveBeenCalledWith(
            unregisteredUsers.map(user => user.email)
          )
          done()
        })
      })

      it('should send the new users to be created with selected role', done => {
        component.handleSave().then(() => {
          expect(props.onCreateRoles).toHaveBeenCalledWith(
            [{ id: '1' }],
            'viewer',
            defaultOpts,
            null
          )
          done()
        })
      })

      describe('adding users over the freemium limit with in_app_billing', () => {
        beforeEach(() => {
          apiStore.currentUserOrganization.in_app_billing = true
          apiStore.currentUserOrganization.has_payment_method = false
          apiStore.currentUserOrganization.active_users_count = 4
        })

        it('should ask for payment method', () => {
          // we are adding 2 users, active_users_count = 4, so this would take us over 5
          expect(component.shouldAskForPaymentMethod).toBeTruthy()
        })
      })

      // describe('adding users over the freemium limit with enterprise billing', () => {
      //   beforeEach(() => {
      //     apiStore.currentUserOrganization.in_app_billing = false
      //     apiStore.currentUserOrganization.has_payment_method = false
      //     apiStore.currentUserOrganization.active_users_count = 40
      //   })
      //
      //   it('should not ask for payment method', () => {
      //     expect(component.shouldAskForPaymentMethod).toBeFalsy()
      //   })
      // })
    })

    describe('with registered users', () => {
      beforeEach(() => {
        component.selectedUsers = registeredUsers
      })

      it('should send the new users to be created with selected role', done => {
        component.handleSave().then(() => {
          expect(props.onCreateRoles).toHaveBeenCalledWith(
            registeredUsers,
            'viewer',
            defaultOpts,
            null
          )
          done()
        })
      })
    })

    describe('when adding to a group', () => {
      beforeEach(() => {
        component.selectedUsers = registeredUsers
        component.handleGroupSelect({ target: { value: fakeGroup.id } })
      })

      it('should pass the group to onCreateRoles()', done => {
        component.handleSave().then(() => {
          expect(props.onCreateRoles).toHaveBeenCalledWith(
            registeredUsers,
            'member',
            Object.assign({}, defaultOpts, { addToGroupId: fakeGroup.id }),
            null
          )
          done()
        })
      })

      describe('when having selected a group', () => {
        beforeEach(async () => {
          component.selectedUsers = [fakeGroup, ...registeredUsers]
          component.handleGroupSelect({ target: { value: fakeGroup.id } })
          await component.handleSave()
        })

        it('should throw an alert with the UI store', () => {
          expect(uiStore.alert).toHaveBeenCalled()
        })
      })
    })

    describe('without invites', () => {
      const ev = { target: {} }

      beforeEach(() => {
        ev.target.checked = false
        component.handleSendInvitesToggle(ev)
        component.selectedUsers = registeredUsers
      })

      it('should send the flag to silence invites', done => {
        component.handleSave().then(() => {
          expect(props.onCreateRoles).toHaveBeenCalledWith(
            registeredUsers,
            'viewer',
            { sendInvites: false, addToGroupId: '' },
            null
          )
          done()
        })
      })
    })
  })
})
