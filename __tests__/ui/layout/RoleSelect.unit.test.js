import { observable, useStrict } from 'mobx'
import RoleSelect from '~/ui/layout/RoleSelect'
import {
  fakeRole
} from '#/mocks/data'

let props
let wrapper

describe('RoleSelect', () => {
  beforeEach(() => {
    useStrict(false)
    props = {
      role: fakeRole,
      user: fakeRole.users[0],
      onDelete: jest.fn(),
      onCreate: jest.fn(),
    }
    wrapper = mount(
      <RoleSelect {...props} />
    )
  })

  describe('onRoleSelect', () => {
    const fakeSelectEvent = {
      preventDefault: jest.fn(),
      target: {
        value: 'viewer'
      }
    }

    it('should call delete role then create role', () => {
      props.onDelete.mockReturnValue(Promise.resolve())
      wrapper.find('RoleSelect').instance().onRoleSelect(fakeSelectEvent)
      expect(props.onDelete).toHaveBeenCalled()
      expect(props.onCreate).toHaveBeenCalled()
    })
  })

  describe('createRole', () => {
    it('should call onCreate with the role data with the rolename', () => {
      wrapper.find('RoleSelect').instance().createRole('viewer')
      const expectedRole = Object.assign({}, {
        name: 'viewer',
        users: [{ id: 1 }]
      })
      expect(props.onCreate).toHaveBeenCalledWith(expectedRole, props.role.id)
    })
  })

  describe('deleteRole', () => {
    it('should call onDelete with the role and user', () => {
      wrapper.find('RoleSelect').instance().deleteRole()
      expect(props.onDelete).toHaveBeenCalledWith(props.role, props.user)
    })
  })
})
