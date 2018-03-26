import { useStrict } from 'mobx'
import RoleSelect from '~/ui/roles/RoleSelect'
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
      roleTypes: ['viewer', 'editor'],
      entity: fakeRole.users[0],
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

    it('should call delete role then create role', (done) => {
      props.onDelete.mockReturnValue(Promise.resolve())
      wrapper.instance().onRoleSelect(fakeSelectEvent).then(() => {
        expect(props.onDelete).toHaveBeenCalled()
        expect(props.onCreate).toHaveBeenCalled()
        done()
      })
    })
  })

  describe('createRole', () => {
    it('should call onCreate with list of users/groups and role name', () => {
      wrapper.instance().createRole('viewer')
      expect(props.onCreate).toHaveBeenCalledWith([fakeRole.users[0]], 'viewer')
    })
  })

  describe('deleteRole', () => {
    beforeEach(() => {
      props.onDelete.mockReturnValue(Promise.resolve())
      wrapper.instance().deleteRole()
    })

    it('should call onDelete with the role and user/group', () => {
      expect(props.onDelete).toHaveBeenCalledWith(props.role, props.entity)
    })
  })
})
