import { observable, useStrict } from 'mobx'
import { Provider } from 'mobx-react'
import OrganizationMenu from '~/ui/organizations/OrganizationMenu'
import {
  fakeUser,
} from '#/mocks/data'

const apiStore = observable({
  currentUser: fakeUser,
  request: jest.fn().mockReturnValue(Promise.resolve({ data: [] })),
  add: jest.fn(),
  removeAll: jest.fn(),
  findAll: jest.fn(),
})
const uiStore = observable({
  organizationMenuOpen: false,
  closeOrganizationMenu: jest.fn()
})
const props = {
  uiStore,
  organization: {
    name: 'Space'
  },
  userGroups: [{ id: 1, name: 'testgroup', }]
}

let wrapper

describe('OrganizationMenu', () => {
  let component

  beforeEach(() => {
    useStrict(false)
    props.userGroups = observable([
      { id: 1, name: 'groupTest', handle: 'test', filestack_file_url: 'jpg' }
    ])
    wrapper = mount(
      <Provider apiStore={apiStore} uiStore={uiStore}>
        <OrganizationMenu {...props} />
      </Provider>
    )
    component = wrapper.find('OrganizationMenu')
  })

  it('only shows itself if the UI Store says it should be open', () => {
    expect(wrapper.find('Dialog').props().open).toBeFalsy()
    uiStore.organizationMenuOpen = true
    wrapper.update()
    expect(wrapper.find('Dialog').props().open).toBeTruthy()
  })

  it('closes the organization menu in the UI store when exited', () => {
    component.instance().handleClose()
    expect(props.uiStore.closeOrganizationMenu).toHaveBeenCalled()
  })

  it('closes the edit menu when changes are save in the UI store', () => {
    component.instance().onOrganizationSave()
    expect(props.uiStore.closeOrganizationMenu).toHaveBeenCalled()
  })

  it('opens the organization edit menu when you click on the org name', () => {
    wrapper.find('.orgEdit').simulate('click')
    expect(component.instance().editOrganizationOpen)
      .toBeTruthy()
  })

  it('opens the group edit menu when you click on any group name', () => {
    wrapper.find('.groupEdit').first().simulate('click')
    expect(component.instance().editGroup).toEqual(props.userGroups[0])
  })

  it('opens the group add menu when you click on the new group button', () => {
    component.instance().handleGroupAddClick()
    expect(component.instance().modifyGroupOpen).toBeTruthy()
    expect(component.instance().editGroup).toEqual({})
  })

  describe('componentDidMount', () => {
    it('should fetch all the user groups from the API', () => {
      expect(apiStore.request).toHaveBeenCalledWith(
        'groups/1/roles',
        'GET'
      )
    })
  })

  describe('onRolesSave', () => {
    let res

    beforeEach(() => {
      res = { data: [{ id: 3 }] }
      component.instance().onRolesSave(res)
    })

    it('should remove all and add back roles to apiStore', () => {
      expect(apiStore.removeAll).toHaveBeenCalledWith('roles')
      expect(apiStore.add).toHaveBeenCalledWith(res.data, 'roles')
    })
  })
})
