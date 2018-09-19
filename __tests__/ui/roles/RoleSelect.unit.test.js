import RoleSelect from '~/ui/roles/RoleSelect'

import { fakeRole } from '#/mocks/data'

let props
let wrapper
let component

describe('RoleSelect', () => {
  beforeEach(() => {
    props = {
      role: fakeRole,
      roleTypes: ['viewer', 'editor'],
      entity: fakeRole.users[0],
      onDelete: jest.fn(),
      onCreate: jest.fn(),
    }
    wrapper = shallow(<RoleSelect {...props} />)
    component = wrapper.instance()
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
        props.role = {
          name: 'admin',
          resource: { internalType: 'groups', is_primary: true },
        }
        wrapper.setProps(props)
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
    let groupResource
    const updateRole = role => {
      props.role = role
      wrapper.setProps(props)
    }

    beforeEach(() => {
      groupResource = { internalType: 'groups' }
    })

    it('should return organization when its a primary/guest group', () => {
      updateRole({
        name: 'admin',
        resource: Object.assign({}, groupResource, { is_primary: true }),
      })
      expect(component.resourceType).toEqual('organization')
    })

    it('should return group when its a normal group', () => {
      updateRole({ name: 'admin', resource: groupResource })
      expect(component.resourceType).toEqual('group')
    })

    it('should return item when its an item', () => {
      updateRole({ name: 'admin', resource: { internalType: 'items' } })
      expect(component.resourceType).toEqual('item')
    })
  })
})
