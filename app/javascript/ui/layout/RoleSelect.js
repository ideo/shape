import PropTypes from 'prop-types'
import styled from 'styled-components'
import { toJS } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

const Row = styled.div`
  display: flex
`
Row.displayName = 'Row'

class RoleSelect extends React.Component {
  onRoleSelect = (ev) => {
    ev.preventDefault()
    this.deleteRole().then(this.createRole(ev.target.value))
  }

  createRole(roleName) {
    const { onCreate, role } = this.props
    const roleData = Object.assign({}, {
      name: roleName,
      users: role.users.map((user) => { return { id: user.id }})
    })
    onCreate(roleData)
  }

  deleteRole = () => {
    const { role, user } = this.props
    return this.props.onDelete(role, user)
  }

  render() {
    const { role, user } = this.props
    return (
      <Row>
        <span>
          {user.name}<br />
          {user.email}
        </span>
        <span>
          <select value={role.name} onChange={this.onRoleSelect}>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </span>
      </Row>
    )
  }
}

RoleSelect.propTypes = {
  role: MobxPropTypes.objectOrObservableObject.isRequired,
  user: MobxPropTypes.objectOrObservableObject.isRequired,
  onDelete: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
}

export default RoleSelect
