import { Fragment } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Collapse } from '@material-ui/core'
import { Heading3, DisplayText } from '~/ui/global/styled/typography'
import { Row, RowItemLeft } from '~/ui/global/styled/layout'
import DropdownIcon from '~/ui/icons/DropdownIcon'
import RolesAdd from '~/ui/roles/RolesAdd'
import RoleSelect from '~/ui/roles/RoleSelect'
import { uiStore } from '~/stores'

// TODO rewrite this
function sortUserOrGroup(a, b) {
  return a.entity.name.localeCompare(b.entity.name)
}

const ScrollArea = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`

const FooterArea = styled.div`
  flex: 0 0 auto;
  padding-top: 24px;
  padding-bottom: ${props => (props.menuOpen ? 100 : 30)}px;
`

const StyledRow = styled(Row)`
  cursor: pointer;
  margin-left: 0;
`
const StyledCollapseToggle = styled.button`
  .icon {
    width: 24px;
    transform: translateY(4px);
  }
`
const StyledExpandToggle = styled.button`
  .icon {
    width: 24px;
    transform: translateY(2px) rotate(-90deg);
  }
`

@inject('apiStore', 'routingStore')
@observer
class RolesMenu extends React.Component {
  state = {}

  entityGroups(entities) {
    const groups = [
      {
        panelTitle: 'Pending Invitations',
        startOpen: false,
        entities: entities.filter(
          role =>
            role.entity.internalType === 'users' &&
            role.entity.status === 'pending'
        ),
      },
      {
        panelTitle: 'Active Users',
        startOpen: true,
        entities: entities.filter(
          role =>
            role.entity.internalType !== 'users' ||
            role.entity.status !== 'pending'
        ),
      },
    ]

    // init state for each group
    groups.forEach(group => {
      if (typeof this.state[group.panelTitle] === 'undefined') {
        this.setState({ [group.panelTitle]: group.startOpen })
      }
    })

    return groups
  }

  deleteRoles = (role, entity, opts = {}) => {
    const { ownerId, ownerType } = this.props
    role.API_delete(entity, ownerId, ownerType, opts).then(res => {
      // We should do a page reload to get the correct user's new org
      if (opts.organizationChange) {
        this.props.routingStore.routeTo('homepage')
        window.location.reload()
      }
      if (!opts.isSwitching) {
        return this.props.onSave(res, { roleName: role.name })
      }
      return {}
    })
  }

  createRoles = (entities, roleName, opts = {}) => {
    const { apiStore, ownerId, ownerType, onSave } = this.props
    const userIds = entities
      .filter(entity => entity.internalType === 'users')
      .map(user => user.id)
    const groupIds = entities
      .filter(entity => entity.internalType === 'groups')
      .map(group => group.id)
    const data = {
      role: { name: roleName },
      group_ids: groupIds,
      user_ids: userIds,
      is_switching: opts.isSwitching,
    }
    return apiStore
      .request(`${ownerType}/${ownerId}/roles`, 'POST', data)
      .then(res => onSave(res, { roleName }))
      .catch(err => {
        uiStore.alert(err.error[0])
      })
  }

  onCreateUsers = emails => {
    const { apiStore } = this.props
    return apiStore
      .request(`users/create_from_emails`, 'POST', { emails })
      .catch(err => {
        uiStore.alert(err.error[0])
      })
  }

  notCurrentUser(entity) {
    // TODO: needs to check group roles too
    if (entity.internalType === 'groups') return true
    const { apiStore } = this.props
    const { currentUser } = apiStore
    return currentUser.id !== entity.id
  }

  render() {
    const {
      addCallout,
      canEdit,
      roles,
      ownerType,
      title,
      fixedRole,
      submissionBox,
    } = this.props
    const roleEntities = []
    roles.forEach(role => {
      role.users.forEach(user => {
        roleEntities.push(Object.assign({}, { role, entity: user }))
      })
      // TODO remove when implemented
      if (!role.groups) return
      role.groups.forEach(group => {
        roleEntities.push(Object.assign({}, { role, entity: group }))
      })
    })
    const sortedRoleEntities = roleEntities.sort(sortUserOrGroup)
    const entityGroups = this.entityGroups(sortedRoleEntities)
    const roleTypes =
      ownerType === 'groups' ? ['member', 'admin'] : ['editor', 'viewer']

    // ability to restrict the selection to only one role type
    // e.g. "admin" is the only selection for Org Admins group
    const addRoleTypes = fixedRole ? [fixedRole] : roleTypes

    return (
      <Fragment>
        <ScrollArea>
          <Heading3>{title}</Heading3>
          {entityGroups.map(group => {
            const { panelTitle, entities } = group
            if (entities.length === 0) return null

            return (
              <div key={panelTitle}>
                <StyledRow
                  align="center"
                  onClick={() => {
                    this.setState({
                      [panelTitle]: !this.state[panelTitle],
                    })
                  }}
                >
                  <DisplayText>
                    {panelTitle} ({entities.length})
                  </DisplayText>
                  <RowItemLeft style={{ marginLeft: '0px' }}>
                    {this.state[panelTitle] ? (
                      <StyledCollapseToggle aria-label="Collapse">
                        <DropdownIcon />
                      </StyledCollapseToggle>
                    ) : (
                      <StyledExpandToggle aria-label="Expand">
                        <DropdownIcon />
                      </StyledExpandToggle>
                    )}
                  </RowItemLeft>
                </StyledRow>
                <Collapse
                  in={this.state[panelTitle]}
                  timeout="auto"
                  unmountOnExit
                >
                  {entities.map(
                    combined =>
                      // NOTE: content_editor is a "hidden" role for now
                      combined.role.name !== 'content_editor' && (
                        <RoleSelect
                          enabled={
                            canEdit &&
                            this.notCurrentUser(combined.entity, combined.role)
                          }
                          key={`${combined.entity.id}_${
                            combined.entity.internalType
                          }_r${combined.role.id}`}
                          role={combined.role}
                          roleTypes={roleTypes}
                          roleLabels={
                            submissionBox ? { viewer: 'participant' } : {}
                          }
                          entity={combined.entity}
                          onDelete={this.deleteRoles}
                          onCreate={this.createRoles}
                        />
                      )
                  )}
                </Collapse>
              </div>
            )
          })}
        </ScrollArea>
        {canEdit && (
          <FooterArea menuOpen={uiStore.autocompleteValues > 0}>
            <Heading3>{addCallout}</Heading3>
            <RolesAdd
              roleTypes={addRoleTypes}
              roleLabels={submissionBox ? { viewer: 'participant' } : {}}
              onCreateRoles={this.createRoles}
              onCreateUsers={this.onCreateUsers}
              ownerType={ownerType}
            />
          </FooterArea>
        )}
      </Fragment>
    )
  }
}

RolesMenu.propTypes = {
  canEdit: PropTypes.bool,
  ownerId: PropTypes.string.isRequired,
  ownerType: PropTypes.string.isRequired,
  fixedRole: PropTypes.string,
  roles: MobxPropTypes.arrayOrObservableArray,
  title: PropTypes.string,
  addCallout: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  submissionBox: PropTypes.bool,
}
RolesMenu.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
RolesMenu.defaultProps = {
  canEdit: false,
  fixedRole: null,
  roles: [],
  title: 'Shared with',
  addCallout: 'Add groups or people:',
  submissionBox: false,
}

export default RolesMenu
