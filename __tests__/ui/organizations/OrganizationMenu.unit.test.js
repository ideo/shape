import { observable, useStrict } from 'mobx'
import { Provider } from 'mobx-react'
import OrganizationMenu from '~/ui/organizations/OrganizationMenu'

const uiStore = observable({
  organizationMenuOpen: false,
  closeOrganizationMenu: jest.fn()
})
const props = {
  uiStore,
  organization: {
    name: 'Space'
  }
}

let wrapper

describe('OrganizationMenu', () => {
  beforeEach(() => {
    useStrict(false)
    wrapper = mount(
      <Provider uiStore={uiStore}>
        <OrganizationMenu.wrappedComponent {...props} />
      </Provider>
    )
  })

  it('only shows itself if the UI Store says it should be open', () => {
    expect(wrapper.find('Dialog').props().open).toBeFalsy()
    uiStore.organizationMenuOpen = true
    wrapper.update()
    expect(wrapper.find('Dialog').props().open).toBeTruthy()
  })

  it('closes the organization menu in the UI store when exited', () => {
    wrapper.instance().handleClose()
    expect(props.uiStore.closeOrganizationMenu).toHaveBeenCalled()
  })

  it('closes the edit menu when changes are save in the UI store', () => {
    wrapper.instance().onSave()
    expect(props.uiStore.closeOrganizationMenu).toHaveBeenCalled()
  })

  it('opens the organization edit menu when you click on the org name', () => {
    wrapper.find('.orgEdit').simulate('click')
    expect(wrapper.find('OrganizationMenu').instance().editOrganizationOpen)
      .toBeTruthy()
  })

  it('opens the group edit menu when you click on any group name', () => {
    const fakeEv = { target: { value: { id: 1, name: 'group' } } }
    wrapper.find('.group').simulate('click', fakeEv)
    expect(wrapper.instance().editGroup).toEqual(fakeEv.target.value)
  })

  it('opens the group add menu when you click on the new group button', () => {
    const fakeEv = { target: { value: { id: 1, name: 'group' } } }
    wrapper.find('.group').simulate('click', fakeEv)
    expect(wrapper.instance().editGroup).toEqual(fakeEv.target.value)
  })
})
