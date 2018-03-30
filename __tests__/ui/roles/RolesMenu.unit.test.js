import { observable, useStrict } from 'mobx'
import { Provider } from 'mobx-react'
import RolesMenu from '~/ui/roles/RolesMenu'
import Role from '~/stores/jsonApi/Role'

import {
  fakeOrganization,
  fakeUser
} from '#/mocks/data'

const apiStore = observable({
  currentUser: {},
  request: jest.fn()
    .mockReturnValue(Promise.resolve({ id: 1 })),
  fetchAll: jest.fn(),
  find: jest.fn()
    .mockReturnValue(Promise.resolve({ roles: [] })),
  remove: jest.fn(),
  add: jest.fn(),
  currentUser: fakeUser,
})
const uiStore = observable({
  rolesMenuOpen: false,
  update: jest.fn()
})
const props = {
  ownerId: 1,
  ownerType: 'collections',
  roles: [],
  apiStore,
  uiStore,
  onSave: jest.fn(),
}

jest.mock('../../../app/javascript/stores/jsonApi/Role')
let wrapper

describe('RolesMenu', () => {
  let component

  beforeEach(() => {
    useStrict(false)
    wrapper = shallow(
      <RolesMenu.wrappedComponent {...props} />
    )
    component = wrapper.instance()
  })

  describe('componentDidMount', () => {
    beforeEach(() => {
      apiStore.request.mockReturnValue(Promise.resolve([{}]))
    })

    it('should request all the organization groups and users', () => {
      expect(apiStore.request).toHaveBeenCalledWith(
        `organizations/${fakeOrganization.id}/users`, 'GET'
      )
      expect(apiStore.request).toHaveBeenCalledWith(
        `organizations/${fakeOrganization.id}/groups`, 'GET'
      )
    })
  })

  describe('onUserSearch', () => {
    describe('when a user is found', () => {
      it('should api request the users search route', (done) => {
        component.onUserSearch('mary').then(() => {
          expect(apiStore.request).toHaveBeenCalledWith(
            'users/search?query=mary'
          )
          done()
        })
      })
    })

  describe('onDelete', () => {
    const role = { id: 2 }
    const user = { id: 4 }
    const res = { data: [] }

    beforeEach(() => {
      apiStore.request.mockReturnValue(Promise.resolve(res))
    })

    describe('with a user', () => {
      it('should make an api store request with correct data', () => {
        const role = { id: 2 }
        const user = { id: 4, type: 'users' }
        component.onDelete(role, user, false)
        expect(apiStore.request).toHaveBeenCalledWith(
          `users/${user.id}/roles/${role.id}`, 'DELETE'
        )
      })
    })

    describe('when to remove is true', () => {
      it('should call the onSave prop after the request is done', (done) => {
        component.onDelete(role, user, true).then(() => {
          expect(props.onSave).toHaveBeenCalledWith(res)
          done()
        })
      })
    })
  })

  describe('onCreateRoles', () => {
    describe('with a users', () => {
      let component
      let users

      beforeEach(() => {
        component = wrapper.find('RolesMenu').instance()
        users = [{ id: 3, type: 'users' }, { id: 5, type: 'users' }]
        apiStore.request.mockReturnValue(Promise.resolve({}))
        apiStore.fetchAll.mockReturnValue(Promise.resolve({ data: [] }))
      })

      it('should send a request to create roles with role and user ids', () => {
        component.onCreateRoles(users, 'editor')
        expect(apiStore.request).toHaveBeenCalledWith(
          'collections/1/roles',
          'POST',
          { role: { name: 'editor' }, user_ids: [3, 5], group_ids: [] }
        )
      })

      it('should call onSave', (done) => {
        component.onCreateRoles(users, 'editor').then(() => {
          expect(props.onSave).toHaveBeenCalled()
          done()
        })
      })
    })
  })

  describe('currentUserCheck', () => {
    describe('on a role that belongs to the current user', () => {
      it('should return false', () => {
        apiStore.currentUser = { id: 3 }
        const user = { id: 3 }
        expect(component.currentUserCheck(user)).toBeFalsy()
      })
    })

    describe('on a role that belongs to another user', () => {
      it('should return true', () => {
        apiStore.currentUser = { id: 4 }
        const user = { id: 3 }
        expect(component.currentUserCheck(user)).toBeTruthy()
      })
    })
  })

  describe('currentUserRoleCheck', () => {
    let user
    let role

    beforeEach(() => {
      apiStore.currentUser = { id: 3 }
      user = { id: 3, name: 'a', pic_url_square: 'something' }
      role = { id: 21, name: 'viewer', users: [user], canEdit: jest.fn() }
      props.roles = [role]
      wrapper.setProps(props)
    })

    describe('when the user has a role that cannot edit', () => {
      it('should return false', () => {
        role.canEdit.mockReturnValue(false)
        expect(component.currentUserRoleCheck()).toBeFalsy()
      })
    })

    describe('when the user has a role that can edit', () => {
      it('should return true', () => {
        role.canEdit.mockReturnValue(true)
        expect(component.currentUserRoleCheck()).toBeTruthy()
      })
    })
  })
})
