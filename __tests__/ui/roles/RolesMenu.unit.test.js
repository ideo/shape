import { observable, useStrict } from 'mobx'
import RolesMenu from '~/ui/roles/RolesMenu'

import {
  fakeOrganization,
  fakeUser,
  fakeRole,
} from '#/mocks/data'

const apiStore = observable({
  request: jest.fn()
    .mockReturnValue(Promise.resolve({ data: [] })),
  fetchAll: jest.fn(),
  find: jest.fn()
    .mockReturnValue(Promise.resolve({ roles: [] })),
  remove: jest.fn(),
  add: jest.fn(),
  currentUser: fakeUser,
  currentUserOrganizationId: 1,
})
const uiStore = observable({
  rolesMenuOpen: false,
  update: jest.fn()
})
let props

jest.mock('../../../app/javascript/stores/jsonApi/Role')
let wrapper

describe('RolesMenu', () => {
  let component

  beforeEach(() => {
    useStrict(false)
    const routingStore = {
      pathTo: jest.fn(),
      routeTo: jest.fn(),
    }
    props = {
      ownerId: 1,
      ownerType: 'collections',
      roles: [],
      apiStore,
      uiStore,
      routingStore,
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

  describe('deleteRoles', () => {
    const role = fakeRole
    const user = { id: 4, internalType: 'users' }
    const res = { data: [] }

    beforeEach(async () => {
      apiStore.request.mockReturnValue(Promise.resolve(res))
      await component.deleteRoles(role, user, { isSwitching: true })
    })

    describe('when switching a role', () => {
      it('should make an call role delete with the correct data', () => {
        expect(role.API_delete).toHaveBeenCalledWith(
          user,
          { isSwitching: true },
        )
      })
    })

    describe('when is not switching', () => {
      beforeEach(async () => {
        component.filterSearchableItems = jest.fn()
        role.API_delete.mockReturnValue = Promise.resolve({})
        await component.deleteRoles(role, user, { isSwitching: false })
      })

      it('should call the onSave prop after the request is done', () => {
        expect(props.onSave).toHaveBeenCalledWith({})
      })

      it('should filter the searchable items', () => {
        expect(component.filterSearchableItems).toHaveBeenCalled()
      })
    })
  })

  describe('createRoles', () => {
    describe('with a users', () => {
      let users
      let opts

      beforeEach(async () => {
        users = [{ id: 3, internalType: 'users' }, { id: 5, internalType: 'users' }]
        opts = { isSwitching: true }
        apiStore.request.mockReturnValue(Promise.resolve({ data: [] }))
        apiStore.fetchAll.mockReturnValue(Promise.resolve({ data: [] }))
        component.filterSearchableItems = jest.fn()
        await component.createRoles(users, 'editor', opts)
      })

      it('should send a request to create roles with role and user ids', () => {
        expect(apiStore.request).toHaveBeenCalledWith(
          'collections/1/roles',
          'POST',
          {
            role: { name: 'editor' },
            user_ids: [3, 5],
            group_ids: [],
            is_switching: true,
          },
        )
      })

      it('should call onSave', () => {
        expect(props.onSave).toHaveBeenCalled()
      })

      it('should filter the searchable items', () => {
        expect(component.filterSearchableItems).toHaveBeenCalled()
      })

      describe('when not switching roles', () => {
        beforeEach(async () => {
          opts.isSwitching = false
          apiStore.request.mockClear()
          await component.createRoles(users, 'editor', opts)
        })

        it('should pass is switching as false', () => {
          expect(apiStore.request.mock.calls[0][2].is_switching).toBeFalsy()
        })
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
