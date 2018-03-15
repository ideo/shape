import { observable, useStrict } from 'mobx'
import { Provider } from 'mobx-react';
import RolesMenu from '~/ui/layout/RolesMenu'

const apiStore = observable({
  request: jest.fn(),
  fetchAll: jest.fn(),
  find: jest.fn(),
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
})
