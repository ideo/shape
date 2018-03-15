import { observable, useStrict } from 'mobx'
import { Provider } from 'mobx-react'
import Role from '~/stores/jsonApi/Role'
import RolesMenu from '~/ui/layout/RolesMenu'

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

  it('calls fetch with the api store on mount', () => {
    expect(apiStore.fetchAll).toHaveBeenCalled()
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

  describe('onReplace', () => {
    let newRole
    let fakeRole

    beforeEach(() => {
      newRole = {
        id: 5,
        name: 'editor',
        users: []
      }
      fakeRole = {
        API_create: jest.fn().mockReturnValue(
          Promise.resolve({ data: newRole })
        )
      }
      Role.mockImplementation(() => fakeRole)
    })

    it('calls api create on a new role', () => {
      wrapper.find('RolesMenu').instance().onReplace(newRole, 4)
      expect(fakeRole.API_create()).resolves.toHaveBeenCalled()
    })

    it('syncs the roles by deleting the old one and adding the new one', done => {
      wrapper.find('RolesMenu').instance().onReplace(newRole, 4).then(() => {
        expect(apiStore.remove).toHaveBeenCalledWith('roles', 4)
        expect(apiStore.add).toHaveBeenCalledWith(newRole)
        done()
      })
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
})
