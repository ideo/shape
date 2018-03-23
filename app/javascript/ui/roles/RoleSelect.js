import _ from 'lodash'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { MenuItem } from 'material-ui/Menu'
import {
  DisplayText,
  SubText
} from '~/ui/global/styled/typography'
import {
  Row,
  RowItemLeft,
} from '~/ui/global/styled/layout'
import { Select } from '~/ui/global/styled/forms'
import UserAvatar from '~/ui/users/UserAvatar'

class RoleSelect extends React.Component {
  onRoleSelect = (ev) => {
    ev.preventDefault()
    return this.deleteRole().then(() => this.createRole(ev.target.value))
  }

  createRole(roleName) {
    const { onCreate, user } = this.props
    onCreate([user], roleName)
  }

  deleteRole = () => {
    const { role, user } = this.props
    return this.props.onDelete(role, user).then(() => {
      role.toUpdate = true
    })
  }

  render() {
    const { role, roleTypes, user } = this.props
    // TODO remove duplication with RolesAdd role select menu
    return (
      <Row>
        <span>
          <UserAvatar
            key={user.id}
            user={user}
            size={38}
          />
        </span>
        <RowItemLeft>
          <DisplayText>{user.name}</DisplayText><br />
          <SubText>{user.email}</SubText>
        </RowItemLeft>
        <span>
          <Select
            classes={{ root: 'select', selectMenu: 'selectMenu' }}
            displayEmpty
            disableUnderline
            name="role"
            onChange={this.onRoleSelect}
            value={role.name}
          >
            { roleTypes.map(roleType =>
              (<MenuItem key={roleType} value={roleType}>
                {_.startCase(roleType)}
              </MenuItem>))
            }
          </Select>
        </span>
      </Row>
    )
  }
}

RoleSelect.propTypes = {
  role: MobxPropTypes.objectOrObservableObject.isRequired,
  roleTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  user: MobxPropTypes.objectOrObservableObject.isRequired,
  onDelete: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
}

export default RoleSelect
