import { observable } from 'mobx'
import RolesMenu from '~/ui/roles/RolesMenu'
import sleep from '~/utils/sleep'
import fakeUiStore from '#/mocks/fakeUiStore'

import { fakeUser, fakeRole, fakeCollection } from '#/mocks/data'

const apiStore = observable({
  request: jest.fn().mockReturnValue(Promise.resolve({ data: [] })),
  searchRoles: jest.fn().mockReturnValue(Promise.resolve({ data: [] })),
  find: jest.fn().mockReturnValue(Promise.resolve({ roles: [] })),
  remove: jest.fn(),
  add: jest.fn(),
  currentUser: fakeUser,
  currentUserOrganizationId: 1,
  uiStore: fakeUiStore,
})

jest.mock('../../../app/javascript/stores/jsonApi/Role')
let props, wrapper, component, rerender

describe('RolesMenu', () => {
  beforeEach(() => {
    const routingStore = {
      pathTo: jest.fn(),
      routeTo: jest.fn(),
    }
    const record = {
      ...fakeCollection,
      roles: [{ name: 'editors', pendingCount: 0, activeCount: 0, users: [] }],
    }
    props = {
      record,
      ownerId: 1,
      ownerType: 'collections',
      apiStore,
      routingStore,
      canEdit: false,
      addedNewRole: false,
    }
    apiStore.searchRoles.mockClear()
    rerender = () => {
      wrapper = shallow(<RolesMenu.wrappedComponent {...props} />)
      component = wrapper.instance()
    }

    rerender()
  })

  describe('componentDidUpdate', () => {
    beforeEach(() => {
      component.initializeRolesAndGroups = jest.fn()
    })

    it('should call initializeRolesAndGroups', () => {
      wrapper.setProps({ addedNewRole: true })
      expect(component.initializeRolesAndGroups).toHaveBeenCalledWith({
        reset: true,
        page: 1,
      })
      expect(apiStore.searchRoles).toHaveBeenCalled()
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
      it('should make a call to delete role with the correct data', () => {
        const { ownerId, ownerType } = props
        expect(role.API_delete).toHaveBeenCalledWith(user, ownerId, ownerType, {
          isSwitching: true,
        })
      })
    })

    describe('when is not switching', () => {
      const fakeData = {}
      beforeEach(async () => {
        component.filterSearchableItems = jest.fn()
        role.API_delete.mockReturnValue = Promise.resolve(fakeData)
        await component.deleteRoles(role, user, { isSwitching: false })
      })

      it('should call apiStore.searchRoles after the request is done', () => {
        expect(apiStore.searchRoles).toHaveBeenCalled()
      })
    })
  })

  describe('notCurrentUser', () => {
    describe('on a role that belongs to the current user', () => {
      it('should return false', () => {
        apiStore.currentUser.id = 3
        const user = { id: 3 }
        expect(component.notCurrentUser(user)).toBeFalsy()
      })
    })

    describe('on a role that belongs to another user', () => {
      it('should return true', () => {
        apiStore.currentUser.id = 4
        const user = { id: 3 }
        expect(component.notCurrentUser(user)).toBeTruthy()
      })
    })
  })

  it('if not editor, does not show viewable by anyone toggle', () => {
    expect(props.canEdit).toEqual(false)
    expect(
      wrapper.find('[data-cy="anyone-can-view-checkbox"]').exists()
    ).toEqual(false)
  })

  describe('with role of content_editor', () => {
    beforeEach(() => {
      props.record.roles[0].activeCount = 1
      props.record.roles[0].name = 'content_editor'
      props.record.roles[0].users = [
        { id: 5, internalType: 'users', name: 'Real Person' },
      ]
      rerender()
    })

    it('does not show user in list', async () => {
      await sleep(10)
      expect(wrapper.find('RoleSelect').length).toEqual(0)
    })
  })
})
