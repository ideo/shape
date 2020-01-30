import googleTagManager from '~/vendor/googleTagManager'
import OrganizationMenu from '~/ui/organizations/OrganizationMenu'
import Organization from '~/stores/jsonApi/Organization'
import { fakeGroup } from '#/mocks/data'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import fakeUiStore from '#/mocks/fakeUiStore'

jest.mock('../../../app/javascript/stores/jsonApi/Organization')
jest.mock('../../../app/javascript/vendor/googleTagManager')

describe('OrganizationMenu', () => {
  let component, props, wrapper

  beforeEach(() => {
    fakeUiStore.viewingCollection = { id: 1 }
    const apiStore = fakeApiStore({
      requestResult: { data: [] },
    })
    props = {
      apiStore,
      uiStore: fakeUiStore,
      routingStore: fakeRoutingStore,
      open: true,
      onClose: jest.fn(),
      organization: {
        save: jest.fn(),
        create: jest.fn(),
        name: 'Space',
        primary_group: {
          id: 1,
          name: 'Space',
          handle: 'space',
          filestack_file_url: 'space.jpg',
          is_primary: true,
        },
        guest_group: {
          id: 11,
          is_guest: true,
        },
        admin_group: {
          id: 12,
          is_admin: true,
        },
      },
      userGroups: [
        { id: 1, name: 'groupTest', handle: 'test', filestack_file_url: 'jpg' },
      ],
    }
    props.uiStore.update.mockClear()
    props.uiStore.alert.mockClear()
    Organization.mockClear()
    wrapper = shallow(<OrganizationMenu.wrappedComponent {...props} />)
    component = wrapper.instance()
  })

  it('closes the organization menu when exited', () => {
    component.handleClose()
    expect(props.onClose).toHaveBeenCalled()
    expect(component.isLoading).toBeFalsy()
    expect(component.editGroup).toEqual({})
  })

  it('closes the edit menu when changes are saved', () => {
    component.saveOrganization(fakeGroup)
    expect(props.uiStore.update).toHaveBeenCalledWith(
      'organizationMenuPage',
      'organizationPeople'
    )
  })

  it('opens the organization edit menu when you click on the org name', () => {
    component.goToEditGroupRoles(props.organization.primary_group)
    expect(props.uiStore.update).toHaveBeenCalledWith(
      'organizationMenuPage',
      'editRoles'
    )
    expect(component.editGroup).toEqual(props.organization.primary_group)
  })

  it('opens the group edit menu when you click on any group name', () => {
    component.goToEditGroup(props.userGroups[0])
    expect(component.editGroup).toEqual(props.userGroups[0])
  })

  it('opens the group add menu when you click on the new group button', () => {
    component.goToAddGroup()
    expect(props.uiStore.update).toHaveBeenCalledWith(
      'organizationMenuPage',
      'addGroup'
    )
    expect(component.editGroup).toEqual({})
  })

  describe('createGroup', () => {
    describe('on a newly created group', () => {
      let newGroup

      beforeEach(async () => {
        newGroup = {
          name: 'newgroup',
          handle: 'ng',
          filestack_file_url: 'new.jpg',
        }
        props.apiStore.request = jest
          .fn()
          .mockReturnValue(Promise.resolve({ data: [] }))
        component.editGroup = { name: 'newgroup' }
        await component.createGroup(newGroup)
      })

      it('should refetch the roles for the new group', () => {
        expect(props.apiStore.fetchRoles).toHaveBeenCalled()
      })

      it('should modify the group roles after synced', () => {
        expect(props.uiStore.update).toHaveBeenCalledWith(
          'organizationMenuPage',
          'editRoles'
        )
      })
    })
  })

  describe('afterGroupSave', () => {
    describe('with a primary group', () => {
      beforeEach(() => {
        component.afterGroupSave(props.organization.primary_group)
      })

      it('should fetch the guest group', () => {
        expect(props.apiStore.fetch).toHaveBeenCalledWith('groups', 11)
      })
    })
  })

  describe('createOrganization', () => {
    let createFn

    beforeEach(async () => {
      createFn = jest.fn().mockReturnValue(Promise.resolve({}))
      Organization.mockImplementation(() => ({
        id: 3,
        slug: 'sluggity',
        create: createFn,
        assign: jest.fn(),
      }))
      await component.createOrganization({ name: 'hello' })
    })

    it('should switch to the new organization', () => {
      expect(props.routingStore.routeTo).toHaveBeenCalledWith('/sluggity')
    })

    it('should save the newly created organization', () => {
      expect(createFn).toHaveBeenCalled()
    })

    it('should call googleTagManager.push', () => {
      expect(googleTagManager.push).toHaveBeenCalledWith({
        event: 'formSubmission',
        // because we have an existing org in apiStore in this case
        formType: 'Additional Org',
        organization: 'sluggity',
      })
    })
  })
})
