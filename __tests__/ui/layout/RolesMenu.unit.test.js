import { observable, useStrict } from 'mobx'
import { Provider } from 'mobx-react'
import RolesMenu from '~/ui/role/RolesMenu'

const apiStore = observable({
  request: jest.fn(),
  fetchAll: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
  add: jest.fn(),
})
const uiStore = observable({
  rolesMenuOpen: false,
  closeRolesMenu: jest.fn()
})
const props = {
  collectionId: 1,
  roles: [],
  uiStore,
}

jest.mock('../../../app/javascript/stores/jsonApi/Role')
let wrapper

describe('RolesMenu', () => {
  beforeEach(() => {
    useStrict(false)
    wrapper = mount(
      <Provider apiStore={apiStore} uiStore={uiStore}>
        <RolesMenu {...props} />
      </Provider>
    )
  })

  it('only shows itself if the UI Store says it should be open', () => {
    expect(wrapper.find('Dialog').props().open).toBeFalsy()
    uiStore.rolesMenuOpen = true
    wrapper.update()
    expect(wrapper.find('Dialog').props().open).toBeTruthy()
  })

  it('closes the roles menu in the UI store when exited', () => {
    wrapper.find('RolesMenu').instance().handleClose()
    expect(props.uiStore.closeRolesMenu).toHaveBeenCalled()
  })

  describe('onDelete', () => {
    it('should make an api store request with correct data', () => {
      const role = { id: 2 }
      const user = { id: 4 }
      wrapper.find('RolesMenu').instance().onDelete(role, user)
      expect(apiStore.request).toHaveBeenCalledWith(
        `users/${user.id}/roles/${role.id}`, 'DELETE'
      )
    })
  })

  describe('onUserSearch', () => {
    describe('when a user is found', () => {
      it('should api request the users search route', (done) => {
        apiStore.request.mockReturnValue(Promise.resolve(
          { data: [{ id: 3 }] }
        ))
        wrapper.find('RolesMenu').instance().onUserSearch('mary').then(() => {
          expect(apiStore.request).toHaveBeenCalledWith(
            'users/search?query=mary'
          )
          done()
        })
      })
    })
  })

  describe('onCreateRoles', () => {
    let component
    let users

    beforeEach(() => {
      component = wrapper.find('RolesMenu').instance()
      users = [{ id: 3 }, { id: 5 }]
      apiStore.request.mockReturnValue(Promise.resolve({}))
      apiStore.fetchAll.mockReturnValue(Promise.resolve({ data: [] }))
    })

    it('should send a request to create roles with role and user ids', () => {
      component.onCreateRoles(users, 'editor')
      expect(apiStore.request).toHaveBeenCalledWith(
        'collections/1/roles',
        'POST',
        { role: { name: 'editor' }, user_ids: [3, 5] }
      )
    })
  })
})
