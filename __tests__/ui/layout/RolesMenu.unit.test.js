import { observable, useStrict } from 'mobx'
import { Provider } from 'mobx-react';
import RolesMenu from '~/ui/layout/RolesMenu'

const uiStore = observable({
  rolesMenuOpen: false,
  closeRolesMenu: jest.fn()
})
const props = {
  uiStore,
}

let wrapper

describe('RolesMenu', () => {
  beforeEach(() => {
    useStrict(false)
    wrapper = mount(
      <Provider uiStore={uiStore}>
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
})
