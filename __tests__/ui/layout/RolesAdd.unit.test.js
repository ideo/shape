import { useStrict } from 'mobx'
import RolesAdd from '~/ui/layout/RolesAdd'

let props
let wrapper

describe('RolesAdd', () => {
  beforeEach(() => {
    useStrict(false)
    props = {
      onCreate: jest.fn(),
      onSearch: jest.fn(),
    }
    wrapper = mount(
      <RolesAdd {...props} />
    )
  })

  describe('onSearch', () => {
    const user = { id: 2, name: 'Uncle Leo' }

    describe('when a user is found', () => {
      beforeEach(() => {
        props.onSearch.mockReturnValue(Promise.resolve(
          { data: [user] }
        ))
      })

      it('should map the data with a value and a user', () => {
        expect(wrapper.find('RolesAdd').instance().onUserSearch('leo'))
          .resolves.toEqual([{ value: user, label: user.name }])
      })
    })
  })

  describe('onUserSelected', () => {
    let component

    beforeEach(() => {
      // Shortcut so this doesn't have to be found every time
      component = wrapper.find('RolesAdd').instance()
    })

    describe('for a already registered user', () => {
      let userDataNew
      let userDataExisting

      beforeEach(() => {
        userDataNew = { id: 3, name: 'Mo', email: 'Mo@mo.com' }
        userDataExisting = { id: 4, name: 't', email: 't@t.t' }
        component.selectedUsers = [userDataExisting]
      })

      it('should add the user to the selectedUsers list if not there', () => {
        component.onUserSelected(userDataNew)
        component.onUserSelected(userDataExisting)
        expect(component.selectedUsers.length).toEqual(2)
      })
    })

    describe('for a new user', () => {
      const newUserData = { custom: 'm@m.m' }
      let existingUsers

      beforeEach(() => {
        existingUsers = [
          { name: 'r@r.r', email: 'r@r.r' }
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
        const anotherUser = { custom: 'r@r.r' }
        component.onUserSelected(anotherUser)
        expect(component.selectedUsers.length).toEqual(1)
      })
    })
  })
})
