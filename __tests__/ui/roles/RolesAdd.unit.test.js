import { useStrict } from 'mobx'
import RolesAdd from '~/ui/roles/RolesAdd'

let props
let wrapper

describe('RolesAdd', () => {
  beforeEach(() => {
    useStrict(false)
    props = {
      searchableItems: [],
      roleTypes: ['viewer', 'editor'],
      onCreate: jest.fn(),
      onCreateUsers: jest.fn(),
      onCreateRoles: jest.fn(),
      onSearch: jest.fn(),
    }
    wrapper = mount(
      <RolesAdd {...props} />
    )
  })

  describe('onUserSearch', () => {
    const user = { id: 2, name: 'Uncle Leo', email: 'leo@leo.l' }
    let component

    beforeEach(() => {
      component = wrapper.instance()
    })

    describe('when a user is found', () => {
      beforeEach(() => {
        props.onSearch.mockReturnValue(Promise.resolve(
          { data: [user] }
        ))
      })

      it('should pass the search term to the parent component', () => {
        component.onUserSearch('term')
        expect(props.onSearch).toHaveBeenCalledWith('term')
      })

      it('should map the data with a value and a user', () => {
        expect(component.onUserSearch('leo'))
          .resolves.toEqual([{ value: user.email, label: user.name, data: user }])
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
          internalType: 'users'
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
      const newUserData = { custom: 'm@m.m', internalType: 'users' }
      let existingUsers

      beforeEach(() => {
        existingUsers = [
          { name: 'r@r.r', email: 'r@r.r', internalType: 'users' }
        ]
        component.selectedUsers = existingUsers
      })

      it('should add the user with a name and email', () => {
        component.onUserSelected(newUserData)
        expect(component.selectedUsers[1]).toEqual({
          name: 'm@m.m',
          email: 'm@m.m'
        })
      })

      it('should not add the same email twice', () => {
        const anotherUser = { custom: 'r@r.r', internalType: 'users' }
        component.onUserSelected(anotherUser)
        expect(component.selectedUsers.length).toEqual(1)
      })
    })
  })

  describe('mapItems', () => {
    describe('with groups', () => {
      it('should map groups with handle as the value', () => {
        props.searchableItems = [
          { id: 3, name: 'groupname', handle: 'group-name', internalType: 'groups' }
        ]
        wrapper.setProps(props)
        expect(wrapper.instance().mapItems()[0]).toEqual(
          { value: 'group-name', label: 'groupname', data: props.searchableItems[0] }
        )
      })
    })

    describe('with users', () => {
      it('should map users with email as the value', () => {
        props.searchableItems = [
          { id: 3, name: 'user', email: 'user@u.u', internalType: 'users' }
        ]
        wrapper.setProps(props)
        expect(wrapper.instance().mapItems()[0]).toEqual(
          { value: 'user@u.u', label: 'user', data: props.searchableItems[0] }
        )
      })
    })
  })

  describe('handleSave', () => {
    let component
    let unregisteredUsers
    let registeredUsers

    beforeEach(() => {
      component = wrapper.instance()
      unregisteredUsers = [
        { email: 'name@name.com' },
        { email: 'mo@mo.com' }
      ]
      registeredUsers = [
        { id: 4, email: 'm@ideo.com', name: 'm' },
        { id: 3, email: 't@ideo.com', name: 't' }
      ]
    })

    describe('with unregistered users', () => {
      beforeEach(() => {
        component.selectedUsers = unregisteredUsers
        props.onCreateUsers.mockReturnValue(Promise.resolve(
          { data: [{ id: 1 }] }
        ))
      })

      it('should send the emails to be created', (done) => {
        component.handleSave().then(() => {
          expect(props.onCreateUsers).toHaveBeenCalledWith(
            unregisteredUsers.map((user) => user.email)
          )
          done()
        })
      })

      it('should send the new users to be created with selected role', (done) => {
        component.handleSave().then(() => {
          expect(props.onCreateRoles).toHaveBeenCalledWith(
            [{ id: 1 }], 'viewer'
          )
          done()
        })
      })
    })

    describe('with registered users', () => {
      beforeEach(() => {
        component.selectedUsers = registeredUsers
      })

      it('should send the new users to be created with selected role', (done) => {
        component.handleSave().then(() => {
          expect(props.onCreateRoles).toHaveBeenCalledWith(
            registeredUsers, 'viewer'
          )
          done()
        })
      })
    })
  })
})
