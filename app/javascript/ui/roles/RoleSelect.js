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
import Avatar from '~/ui/global/Avatar'
import { uiStore } from '~/stores'

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
    const { entity } = this.props
    let prompt
    let confirmText
    if (entity.isCurrentUser && entity.isCurrentUser()) {
      prompt = 'Are you sure you want to leave this group?'
      confirmText = 'Leave'
    } else {
      prompt = `Are you sure you want to remove
        ${this.renderName()} from this group?`
      confirmText = 'Remove'
    }
    uiStore.openAlertModal({
      prompt,
      confirmText,
      iconName: 'LeaveIcon',
      onConfirm: () => this.deleteRole(true),
    })
  }

  onRoleSelect = (ev) => {
    ev.preventDefault()
    return this.deleteRole().then(() => this.createRole(ev.target.value))
  }

  createRole(roleName) {
    const { onCreate, entity } = this.props
    onCreate([entity], roleName)
  }

  deleteRole = (toRemove = false) => {
    const { role, entity } = this.props
    return this.props.onDelete(role, entity, toRemove)
  }

  renderName() {
    const { entity } = this.props
    let nameDisplay = entity.name
    if (!entity.name || entity.name.trim().length === 0) {
      nameDisplay = entity.email
    }
    if (entity.type === 'users' && entity.isCurrentUser()) {
      nameDisplay += ' (you)'
    }
    if (entity.type === 'users' && entity.status === 'pending') {
      nameDisplay += ' (pending)'
    }
    return nameDisplay
  }

  render() {
    const { enabled, role, roleTypes, entity } = this.props
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
    const url = entity.pic_url_square || entity.filestack_file_url
    return (
      <Row>
        <span>
          <Avatar
            key={entity.id}
            url={url}
            size={38}
          />
        </span>
        <RowItemLeft>
          { entity.name && entity.name.trim().length > 0
            ? (<div>
              <DisplayText>{this.renderName()}</DisplayText><br />
              <SubText>{entity.email}</SubText>
            </div>)
            : (<CenterAlignedSingleItem>
              <DisplayText>{this.renderName()}</DisplayText>
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
  entity: MobxPropTypes.objectOrObservableObject.isRequired,
  onDelete: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  enabled: PropTypes.bool
}
RoleSelect.defaultProps = {
  enabled: true
}

export default RoleSelect
