import { observable, useStrict } from 'mobx'
import { Provider } from 'mobx-react'
import RolesMenu from '~/ui/roles/RolesMenu'
import {
  fakeOrganization,
  fakeUser
} from '#/mocks/data'

const apiStore = observable({
  request: jest.fn(),
  fetchAll: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
  add: jest.fn(),
  currentUser: fakeUser,
})
const uiStore = observable({
  rolesMenuOpen: false,
  closeRolesMenu: jest.fn()
})
const props = {
  ownerId: 1,
  ownerType: 'collections',
  roles: [],
  uiStore,
  onSave: jest.fn(),
}

jest.mock('../../../app/javascript/stores/jsonApi/Role')
let wrapper

describe('RolesMenu', () => {
  beforeEach(() => {
    useStrict(false)
    apiStore.request.mockReturnValue(Promise.resolve(
      { data: [{ id: 55 }] }
    ))
    wrapper = mount(
      <Provider apiStore={apiStore} uiStore={uiStore}>
        <RolesMenu {...props} />
      </Provider>
    )
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

  describe('onDelete', () => {
    describe('with a user', () => {
      it('should make an api store request with correct data', () => {
        const role = { id: 2 }
        const user = { id: 4, type: 'users' }
        wrapper.find('RolesMenu').instance().onDelete(role, user)
        expect(apiStore.request).toHaveBeenCalledWith(
          `users/${user.id}/roles/${role.id}`, 'DELETE'
        )
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
})
