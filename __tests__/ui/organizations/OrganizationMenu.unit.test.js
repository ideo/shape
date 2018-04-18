import OrganizationMenu from '~/ui/organizations/OrganizationMenu'
import {
  fakeUser,
} from '#/mocks/data'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

describe('OrganizationMenu', () => {
  let component, props, wrapper

  beforeEach(() => {
    fakeApiStore.currentUser = fakeUser
    fakeApiStore.request = jest.fn().mockReturnValue(
      Promise.resolve({ data: [] })
    )
    props = {
      apiStore: fakeApiStore(),
      uiStore: fakeUiStore,
      open: true,
      onClose: jest.fn(),
      organization: {
        name: 'Space',
        primary_group: {
          id: 1,
          name: 'Space',
          handle: 'space',
          filestack_file_url: 'space.jpg',
        }
      },
      userGroups: [
        { id: 1, name: 'groupTest', handle: 'test', filestack_file_url: 'jpg' }
      ]
    }
    wrapper = shallow(
      <OrganizationMenu.wrappedComponent {...props} />
    )
    component = wrapper.instance()
  })

  it('closes the organization menu when exited', () => {
    component.handleClose()
    expect(component.currentPage).toEqual('organizationPeople')
    expect(component.isLoading).toBeFalsy()
    expect(props.onClose).toHaveBeenCalled()
  })

  it('closes the edit menu when changes are saved', () => {
    component.onOrganizationSave()
    expect(component.currentPage).toEqual('organizationPeople')
  })

  it('opens the organization edit menu when you click on the org name', () => {
    component.goToEditGroupRoles(props.organization.primary_group)
    expect(component.currentPage).toEqual('editRoles')
    expect(component.editGroup).toEqual(props.organization.primary_group)
  })

  it('opens the group edit menu when you click on any group name', () => {
    component.goToEditGroup(props.userGroups[0])
    expect(component.editGroup).toEqual(props.userGroups[0])
  })

  it('opens the group add menu when you click on the new group button', () => {
    component.goToAddGroup()
    expect(component.currentPage).toEqual('editGroup')
    expect(component.editGroup).toEqual({})
  })

  describe('componentDidMount', () => {
    it('should fetch all the user groups from the API', () => {
      expect(props.apiStore.request).toHaveBeenCalledWith(
        'groups/1/roles',
        'GET'
      )
    })
  })

  describe('onRolesSave', () => {
    let res

    beforeEach(() => {
      res = { data: [{ id: 3 }] }
      component.onRolesSave(res)
    })

    it('should remove all and add back roles to apiStore', () => {
      expect(props.apiStore.sync).toHaveBeenCalledWith(res)
    })
  })

  describe('onGroupSave', () => {
    describe('on a newly created group', () => {
      let newGroup

      beforeEach(async () => {
        newGroup = {
          id: 5,
          name: 'newgroup',
          handle: 'ng',
          filestack_file_url: 'new.jpg'
        }
        props.apiStore.request = jest.fn().mockReturnValue(
          Promise.resolve({ data: [] })
        )
        component.editGroup = { name: 'newgroup' }
        await component.onGroupSave(newGroup)
      })

      it('should refetch the roles for the new group', () => {
        expect(props.apiStore.request).toHaveBeenCalledWith(`groups/5/roles`, 'GET')
      })

      it('should sync the api store with the request result', () => {
        expect(props.apiStore.sync).toHaveBeenCalled()
      })

      it('should modify the group roles after synced', () => {
        expect(component.currentPage).toEqual('editRoles')
      })
    })
  })
})
