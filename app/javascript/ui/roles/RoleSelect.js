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
  margin-top: ${props => (props.enabled ? 8 : 2)}px;
  width: 16px;
`
LeaveIconHolder.displayName = 'StyledLeaveIconHolder'

const CenterAlignedSingleItem = styled.div`
  margin-top: 6px;
`
CenterAlignedSingleItem.displayName = 'StyledCenterAlignedSingleItem'

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

  deleteRole = (toRemove = false) => {
    const { role, user } = this.props
    return this.props.onDelete(role, user, toRemove)
  }

  render() {
    const { enabled, role, roleTypes, user } = this.props
    let select
    if (enabled) {
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
    console.log('user name', user.name.length)
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
          { user.name && user.name.trim().length > 0
            ? (<div>
              <DisplayText>{user.name}</DisplayText><br />
              <SubText>{user.email}</SubText>
            </div>)
            : (<CenterAlignedSingleItem>
              <DisplayText>{user.email}</DisplayText>
            </CenterAlignedSingleItem>)
          }
        </RowItemLeft>
        <MinRowItem>
          {select}
        </MinRowItem>
        <LeaveIconHolder enabled={enabled} onClick={this.onRoleRemove}>
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
