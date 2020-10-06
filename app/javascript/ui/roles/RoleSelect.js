import styled from 'styled-components'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import Grid from '@material-ui/core/Grid'
import MenuItem from '@material-ui/core/MenuItem'
import { DisplayText } from '~/ui/global/styled/typography'
import { Row, RowItemGrid } from '~/ui/global/styled/layout'
import EntityAvatarAndName from '~/ui/global/EntityAvatarAndName'
import { Select } from '~/ui/global/styled/forms'
import LeaveIcon from '~/ui/icons/LeaveIcon'
import Tooltip from '~/ui/global/Tooltip'
import { uiStore } from '~/stores'
import { LeaveButton } from '~/ui/global/styled/buttons'

const minRowStyle = {
  minWidth: '110px',
}

const DisplayTextPadded = styled(DisplayText)`
  /* match the padding of MuiSelect */
  padding: 6px 0 7px;
  display: inline-block;
`

class RoleSelect extends React.Component {
  get isGuestOrAdminGroup() {
    const { record } = this.props
    if (record && record.internalType === 'groups') {
      return record.isGuestOrAdmin
    }
    return false
  }

  get isJoinableGroup() {
    const { entity, record } = this.props
    return (
      entity.internalType === 'groups' && record.joinable_group_id === entity.id
    )
  }

  get resourceType() {
    const { record } = this.props
    if (record.internalType === 'groups') {
      return record.is_primary || record.is_guest ? 'organization' : 'group'
    }
    return record.internalType.slice(0, -1)
  }

  onRoleRemove = async ev => {
    ev.preventDefault()
    const { record, role, entity } = this.props
    let prompt
    let confirmText
    let iconName = 'Leave'
    if (entity.isCurrentUser) {
      prompt = `Are you sure you want to leave this ${this.resourceType}?`
      confirmText = 'Leave'
    } else {
      prompt = `Are you sure you want to remove
        ${this.renderName()} from this ${this.resourceType}?`
      confirmText = 'Remove'
    }

    let becomesPrivate = false
    if (record.internalType !== 'groups' && !record.is_private) {
      becomesPrivate = await record.API_willBecomePrivate({
        removing: entity,
        roleName: role.name,
      })
    }
    if (becomesPrivate) {
      const parentName = record.parent
        ? `"${record.parent.name}"`
        : 'the parent collection'
      iconName = 'Hidden'
      prompt += ` This change will break permission inheritance from ${parentName}.`
      prompt += ` New people added to ${parentName} will no longer get access to "${record.name}".`
    }

    uiStore.confirm({
      prompt,
      confirmText,
      iconName,
      onConfirm: () => this.deleteRole({ isSwitching: false, becomesPrivate }),
    })
  }

  onRoleSelect = ev => {
    ev.preventDefault()
    // switching the dropdown calls a delete and then create role
    return this.deleteRole().then(() => this.createRole(ev.target.value))
  }

  async createRole(roleName, isSwitching = true) {
    const { onCreate, entity, afterSwitchRoles } = this.props
    await onCreate([entity], roleName, { isSwitching })
    afterSwitchRoles()
  }

  deleteRole = ({ isSwitching = true, becomesPrivate = false } = {}) => {
    const { role, entity } = this.props
    const organizationChange =
      this.resourceType === 'organization' && entity.isCurrentUser
    return this.props.onDelete(role, entity, {
      isSwitching,
      organizationChange,
      becomesPrivate,
    })
  }

  labelFor = roleType => {
    const { roleLabels } = this.props
    // either return the override label (if present) or just the passed in name
    // e.g. for labeling "Viewer" as "Participant"
    return _.startCase(roleLabels[roleType] || roleType)
  }

  renderName() {
    const { entity } = this.props
    return entity.nameWithHints || entity.name
  }

  render() {
    const { enabled, record, role, roleTypes, entity } = this.props
    let select
    if (!this.isGuestOrAdminGroup && enabled) {
      select = (
        <Select
          classes={{ root: 'select', selectMenu: 'selectMenu' }}
          displayEmpty
          disableUnderline
          name="role"
          onChange={this.onRoleSelect}
          value={role.name}
        >
          {roleTypes.map(roleType => (
            <MenuItem key={roleType} value={roleType}>
              <DisplayText>{this.labelFor(roleType)}</DisplayText>
            </MenuItem>
          ))}
        </Select>
      )
    } else {
      select = <DisplayTextPadded>{this.labelFor(role.name)}</DisplayTextPadded>
    }

    // TODO remove duplication with RolesAdd role select menu
    const showLeaveIcon =
      (enabled && !this.isJoinableGroup) ||
      (entity.isCurrentUser &&
        !record.system_required &&
        !record.pinned_and_locked)
    return (
      <Row data-cy="role-row">
        <RowItemGrid container alignItems="center" justify="space-between">
          <EntityAvatarAndName
            entity={entity}
            isJoinableGroup={this.isJoinableGroup}
          />
          <Grid item style={minRowStyle}>
            {select}
          </Grid>
        </RowItemGrid>
        {showLeaveIcon && (
          <Tooltip
            classes={{ tooltip: 'Tooltip' }}
            title={entity.isCurrentUser ? 'Leave' : 'Remove'}
            placement="bottom"
          >
            <LeaveButton onClick={this.onRoleRemove}>
              <LeaveIcon />
            </LeaveButton>
          </Tooltip>
        )}
        {/* just show placeholder for button */}
        {!showLeaveIcon && <LeaveButton />}
      </Row>
    )
  }
}

RoleSelect.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  role: MobxPropTypes.objectOrObservableObject.isRequired,
  roleTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  entity: MobxPropTypes.objectOrObservableObject.isRequired,
  roleLabels: PropTypes.shape({
    editor: PropTypes.string,
    viewer: PropTypes.string,
  }),
  onDelete: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  enabled: PropTypes.bool,
  afterSwitchRoles: PropTypes.func.isRequired,
}
RoleSelect.defaultProps = {
  enabled: true,
  roleLabels: {},
}

export default RoleSelect
