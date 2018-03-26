import _ from 'lodash'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { MenuItem } from 'material-ui/Menu'
import styled from 'styled-components'
import {
  DisplayText,
  SubText
} from '~/ui/global/styled/typography'
import {
  Row,
  RowItemLeft,
} from '~/ui/global/styled/layout'
import { Select } from '~/ui/global/styled/forms'
import LeaveIcon from '~/ui/icons/LeaveIcon'
import UserAvatar from '~/ui/users/UserAvatar'

const MinRowItem = styled.span`
  min-width: 110px;
`

const LeaveIconHolder = styled.button`
  margin-top: 8px;
  width: 16px;
`
LeaveIconHolder.displayName = 'StyledLeaveIconHolder'

class RoleSelect extends React.Component {
  onRoleRemove = (ev) => {
    ev.preventDefault()
    this.deleteRole(true)
  }

  onRoleSelect = (ev) => {
    ev.preventDefault()
    return this.deleteRole().then(() => this.createRole(ev.target.value))
  }

  createRole(roleName) {
    const { onCreate, user } = this.props
    onCreate([user], roleName)
  }

  deleteRole = (toRemove) => {
    const { role, user } = this.props
    return this.props.onDelete(role, user, toRemove)
  }

  render() {
    const { role, roleTypes, user } = this.props
    let select
    if (this.props.enabled) {
      select = (
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
      )
    } else {
      select = <DisplayText>{_.startCase(role.name)}</DisplayText>
    }
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
        <MinRowItem>
          {select}
        </MinRowItem>
        <LeaveIconHolder onClick={this.onRoleRemove}>
          <LeaveIcon />
        </LeaveIconHolder>
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
  enabled: PropTypes.bool
}
RoleSelect.defaultProps = {
  enabled: true
}

export default RoleSelect
