import RolesAdd from '~/ui/roles/RolesAdd'
import { apiStore } from '~/stores'

jest.mock('../../../app/javascript/stores')

let props
let wrapper
let defaultOpts

describe('RolesAdd', () => {
  beforeEach(() => {
    props = {
      searchableItems: [],
      roleTypes: ['viewer', 'editor'],
      onCreate: jest.fn(),
      onCreateUsers: jest.fn(),
      onCreateRoles: jest.fn(),
      onSearch: jest.fn(),
      ownerType: 'collections',
    }
    wrapper = mount(<RolesAdd {...props} />)
    defaultOpts = { sendInvites: true }
  })

  describe('_autocompleteSearch', () => {
    // test the non-debounced function

    describe('with groups', () => {
      beforeEach(() => {
        wrapper = mount(<RolesAdd {...props} ownerType="groups" />)
      })

      it('should call apiStore to search users only', () => {
        wrapper.instance()._autocompleteSearch('person', jest.fn())
        expect(apiStore.searchUsers).toHaveBeenCalledWith('person')
      })
    })

    describe('with collections', () => {
      beforeEach(() => {
        wrapper = mount(<RolesAdd {...props} ownerType="collections" />)
      })

      it('should call apiStore to search users only', () => {
        wrapper.instance()._autocompleteSearch('person', jest.fn())
        expect(apiStore.searchUsersAndGroups).toHaveBeenCalledWith('person')
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
          id: 3,
          name: 'Mo',
          email: 'Mo@mo.com',
          internalType: 'users',
        }
        userDataExisting = {
          id: 4,
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
            id: 3,
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
          { id: 3, name: 'user', email: 'user@u.com', internalType: 'users' },
        ]
        expect(wrapper.instance().mapItems(searchableItems)[0]).toEqual({
          value: 'user@u.com',
          label: 'user',
          data: searchableItems[0],
        })
      })
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
        { id: 4, email: 'm@ideo.com', name: 'm' },
        { id: 3, email: 't@ideo.com', name: 't' },
      ]
    })

    describe('with unregistered users', () => {
      beforeEach(() => {
        component.selectedUsers = unregisteredUsers
        props.onCreateUsers.mockReturnValue(
          Promise.resolve({ data: [{ id: 1 }] })
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
            [{ id: 1 }],
            'viewer',
            defaultOpts
          )
          done()
        })
      })
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
            defaultOpts
          )
          done()
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
            { sendInvites: false }
          )
          done()
        })
      })
    })
  })
})
