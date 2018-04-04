import { observable, useStrict } from 'mobx'
import { Provider } from 'mobx-react'
import RolesMenu from '~/ui/roles/RolesMenu'

import {
  fakeOrganization,
  fakeUser
} from '#/mocks/data'

let props, apiStore, uiStore

jest.mock('../../../app/javascript/stores/jsonApi/Role')
let wrapper

describe('RolesMenu', () => {
  let component

  beforeEach(() => {
    useStrict(false)
    // TODO use fake stores
    apiStore = {
      request: jest.fn()
        .mockReturnValue(Promise.resolve({ data: [] })),
      fetchAll: jest.fn(),
      find: jest.fn()
        .mockReturnValue(Promise.resolve({ roles: [] })),
      remove: jest.fn(),
      add: jest.fn(),
      currentUser: fakeUser,
    }
    uiStore = {
      openAlertModal: jest.fn(),
      rolesMenuOpen: false,
      update: jest.fn()
    }
    props = {
      ownerId: 1,
      ownerType: 'collections',
      roles: [],
      apiStore,
      uiStore,
      onSave: jest.fn(),
    }
    wrapper = shallow(
      <RolesMenu.wrappedComponent {...props} />
    )
    component = wrapper.instance()
  })

  describe('componentDidMount', () => {
    beforeEach(() => {
      component.filterSearchableItems = jest.fn()
      apiStore.request.mockReturnValue(Promise.resolve({ data: [] }))
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

  describe('filterSearchableItems', () => {
    let roles
    let visibleUsers
    let visibleGroups

    beforeEach(() => {
      roles = [
        { id: 23, users: [{ id: 3, internalType: 'users' }], groups: [] },
        { id: 26, groups: [{ id: 6, internalType: 'groups' }], users: [] },
      ]
      visibleUsers = [
        { id: 3, internalType: 'users' },
        { id: 33, internalType: 'users' },
      ]
      visibleGroups = [
        { id: 6, internalType: 'groups' },
        { id: 64, internalType: 'groups' },
      ]
      wrapper.setProps(props)
      component.visibleUsers = visibleUsers
      component.visibleGroups = visibleGroups
      props.roles = roles
      component.filterSearchableItems()
    })

    it('should filter out users in roles from visible users', () => {
      expect(component.searchableItems).toContainEqual(visibleUsers[1])
      expect(component.searchableItems).not.toContainEqual(visibleUsers[0])
    })

    it('should filter out groups in roles from visible groups', () => {
      expect(component.searchableItems).toContainEqual(visibleGroups[1])
      expect(component.searchableItems).not.toContainEqual(visibleGroups[0])
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
  })

  describe('onDelete', () => {
    let role = { id: 2 }
    let user = { id: 4 }
    const res = { data: [] }

    beforeEach(() => {
      apiStore.request.mockReturnValue(Promise.resolve(res))
    })

    describe('with a user', () => {
      it('should make an api store request with correct data', () => {
        role = { id: 2 }
        user = { id: 4, internalType: 'users' }
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

      it('should filter the searchable items', (done) => {
        component.filterSearchableItems = jest.fn()
        component.onDelete(role, user, true).then(() => {
          expect(component.filterSearchableItems).toHaveBeenCalled()
          done()
        })
      })
    })
  })

  describe('onCreateRoles', () => {
    describe('with a users', () => {
      let users

      beforeEach(() => {
        users = [{ id: 3, internalType: 'users' }, { id: 5, internalType: 'users' }]
        apiStore.request.mockReturnValue(Promise.resolve({ data: [] }))
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

      it('should filter the searchable items', (done) => {
        component.filterSearchableItems = jest.fn()
        component.onCreateRoles(users, 'editor').then(() => {
          expect(component.filterSearchableItems).toHaveBeenCalled()
          done()
        })
      })
    })

    describe('with errors', () => {
      beforeEach(() => {
        apiStore.request.mockReturnValue(
          Promise.reject({ error: [ 'bad' ] }))
        component.onCreateRoles([], 'editor')
      })

      it('should open an alert modal', () => {
        expect(props.uiStore.openAlertModal).toHaveBeenCalled()
      })
    })
  })

  describe('currentUserCheck', () => {
    describe('on a role that belongs to the current user', () => {
      it('should return false', () => {
        apiStore.currentUser.id = 3
        const user = { id: 3 }
        expect(component.currentUserCheck(user)).toBeFalsy()
      })
    })

    describe('on a role that belongs to another user', () => {
      it('should return true', () => {
        apiStore.currentUser.id = 4
        const user = { id: 3 }
        expect(component.currentUserCheck(user)).toBeTruthy()
      })
    })
  })
})
