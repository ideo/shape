import RoleSelect from '~/ui/roles/RoleSelect'

import { fakeRole, fakeCollection } from '#/mocks/data'

let props, wrapper, component, updateRecord

describe('RoleSelect', () => {
  beforeEach(() => {
    props = {
      role: fakeRole,
      record: fakeCollection,
      roleTypes: ['viewer', 'editor'],
      entity: fakeRole.users[0],
      onDelete: jest.fn(),
      onCreate: jest.fn(),
    }
    wrapper = shallow(<RoleSelect {...props} />)
    component = wrapper.instance()

    updateRecord = record => {
      props.record = record
      wrapper.setProps(props)
    }
  })

  describe('render', () => {
    it('should not render the select for guest groups', () => {
      props.role = { resource: { internalType: 'groups', is_guest: true } }
      wrapper.setProps(props)
      expect(wrapper.find('Select').length).toEqual(0)
    })
  })

  describe('onRoleSelect', () => {
    const fakeSelectEvent = {
      preventDefault: jest.fn(),
      target: {
        value: 'viewer',
      },
    }

    it('should call delete role then create role', done => {
      props.onDelete.mockReturnValue(Promise.resolve())
      wrapper
        .instance()
        .onRoleSelect(fakeSelectEvent)
        .then(() => {
          expect(props.onDelete).toHaveBeenCalled()
          expect(props.onCreate).toHaveBeenCalled()
          done()
        })
    })
  })

  describe('createRole', () => {
    it('should call onCreate with list of users/groups and role name', () => {
      wrapper.instance().createRole('viewer')
      expect(props.onCreate).toHaveBeenCalledWith(
        [fakeRole.users[0]],
        'viewer',
        { isSwitching: true }
      )
    })
  })

  describe('deleteRole', () => {
    beforeEach(() => {
      props.onDelete.mockReturnValue(Promise.resolve())
      wrapper.instance().deleteRole()
    })

    it('should call onDelete with the role and user/group', () => {
      expect(props.onDelete).toHaveBeenCalledWith(props.role, props.entity, {
        isSwitching: true,
        organizationChange: false,
      })
    })

    describe('when deleting the current user from an org group', () => {
      beforeEach(() => {
        props.entity.isCurrentUser = true
        updateRecord({
          id: 1,
          internalType: 'groups',
          is_primary: true,
        })
        component.deleteRole()
      })

      it('should pass the organizationChange option to the onDelete', () => {
        expect(props.onDelete).toHaveBeenCalledWith(props.role, props.entity, {
          isSwitching: true,
          organizationChange: true,
        })
      })
    })
  })

  describe('resourceType', () => {
    it('should return organization when its a primary/guest group', () => {
      updateRecord({
        id: 1,
        internalType: 'groups',
        is_primary: true,
      })
      expect(component.resourceType).toEqual('organization')
    })

    it('should return group when its a normal group', () => {
      updateRecord({
        id: 1,
        internalType: 'groups',
      })
      expect(component.resourceType).toEqual('group')
    })

    it('should return item when its an item', () => {
      updateRecord({
        id: 1,
        internalType: 'items',
      })
      expect(component.resourceType).toEqual('item')
    })
  })
})
