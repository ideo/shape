import _ from 'lodash'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import Grid from '@material-ui/core/Grid'
import MenuItem from '@material-ui/core/MenuItem'
import styled from 'styled-components'
import { DisplayText, SubText } from '~/ui/global/styled/typography'
import { Row } from '~/ui/global/styled/layout'
import { Select } from '~/ui/global/styled/forms'
import LeaveIcon from '~/ui/icons/LeaveIcon'
import Tooltip from '~/ui/global/Tooltip'
import Avatar from '~/ui/global/Avatar'
import { uiStore } from '~/stores'

const minRowStyle = {
  minWidth: '110px',
}

const RowItemGrid = styled(Grid)`
  align-self: center;
  margin-left: 14px;
`

const LeaveIconHolder = styled.button`
  margin-top: 8px;
  width: 16px;
`
LeaveIconHolder.displayName = 'StyledLeaveIconHolder'

const DisplayTextPadded = DisplayText.extend`
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
      prompt += ` New people added to ${parentName} will no longer get access to "${
        record.name
      }".`
      // confirmText = 'Continue'
    }

    uiStore.confirm({
      prompt,
      confirmText,
      iconName,
      onConfirm: () => this.deleteRole(false),
    })
  }

  onRoleSelect = ev => {
    ev.preventDefault()
    // switching the dropdown calls a delete and then create role
    return this.deleteRole().then(() => this.createRole(ev.target.value))
  }

  createRole(roleName, isSwitching = true) {
    const { onCreate, entity } = this.props
    onCreate([entity], roleName, { isSwitching })
  }

  deleteRole = (isSwitching = true) => {
    const { role, entity } = this.props
    const organizationChange =
      this.resourceType === 'organization' && entity.isCurrentUser
    return this.props.onDelete(role, entity, {
      isSwitching,
      organizationChange,
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
    const url = entity.pic_url_square || entity.filestack_file_url
    const showLeaveIcon =
      enabled ||
      (entity.isCurrentUser &&
        !record.system_required &&
        !record.pinned_and_locked)
    return (
      <Row>
        <span>
          <Avatar
            key={entity.id}
            url={url}
            // user_profile_collection_id will be null if its a group
            linkToCollectionId={entity.user_profile_collection_id}
          />
        </span>
        <RowItemGrid container justify="space-between">
          <Grid item xs={12} sm>
            {entity.name && entity.name.trim().length > 0 ? (
              <Grid container direction="column">
                <DisplayText>{this.renderName()}</DisplayText>
                <SubText>{entity.email}</SubText>
              </Grid>
            ) : (
              <DisplayText>{this.renderName()}</DisplayText>
            )}
          </Grid>
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
            <LeaveIconHolder onClick={this.onRoleRemove}>
              <LeaveIcon />
            </LeaveIconHolder>
          </Tooltip>
        )}
        {!showLeaveIcon && <LeaveIconHolder enabled={false} />}
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
}
RoleSelect.defaultProps = {
  enabled: true,
  roleLabels: {},
}

export default RoleSelect
