import _ from 'lodash'
import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { ShowMoreButton } from '~/ui/global/styled/forms'
import { Heading3 } from '~/ui/global/styled/typography'
import {
  Row,
  ScrollArea,
  StyledHeaderRow,
  FooterBreak,
} from '~/ui/global/styled/layout'
import ExpandableSearchInput from '~/ui/global/ExpandableSearchInput'
import Panel from '~/ui/global/Panel'
import RoleSelect from '~/ui/roles/RoleSelect'
import PublicSharingOptions from '~/ui/global/PublicSharingOptions'

// TODO rewrite this
function sortUserOrGroup(a, b) {
  return a.entity.name.localeCompare(b.entity.name)
}

const roleTypes = type => {
  if (type === 'groups') return ['member', 'admin']
  return ['editor', 'viewer']
}

@inject('apiStore', 'routingStore')
@observer
class RolesMenu extends React.Component {
  state = {
    searchText: '',
    groups: [],
    groupsByStatus: [],
    page: {
      pending: 1,
      active: 1,
      archived: 1,
    },
  }

  @observable
  loadingMore = false

  constructor(props) {
    super(props)
    this.debouncedInit = _.debounce(this.initializeRolesAndGroups, 300)
  }

  componentDidMount() {
    this.initializeRolesAndGroups({ reset: true, page: 1 })
    const {
      record: { anyone_can_view },
    } = this.props
    this.setState({ anyoneCanView: anyone_can_view })
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.addedNewRole && this.props.addedNewRole) {
      this.initializeRolesAndGroups({ reset: true, page: 1 })
    }
  }

  async initializeRolesAndGroups({
    reset = false,
    page = 1,
    skipSearch = false,
    status = 'both',
  } = {}) {
    const { apiStore, record } = this.props
    const { searchText } = this.state

    if (!skipSearch) {
      runInAction(() => {
        this.loadingMore = true
      })
      if (status === 'both' || status === 'active') {
        await apiStore.searchRoles(record, { reset, page, query: searchText })
      }
      if (status === 'both' || status === 'pending') {
        await apiStore.searchRoles(record, {
          status: 'pending',
          page,
          query: searchText,
        })
      }
      if (status === 'both' || status === 'archived') {
        await apiStore.searchRoles(record, {
          status: 'archived',
          page,
          query: searchText,
        })
      }
      runInAction(() => {
        this.loadingMore = false
      })
    }

    const roleEntities = []
    const counts = {
      // the total counts are stored on each role, just need to grab one
      pending: record.roles[0].pendingCount,
      active: record.roles[0].activeCount,
      archived: record.roles[0].archivedCount,
    }
    const groups = []
    record.roles.forEach(role => {
      role.users.forEach(user => {
        roleEntities.push(Object.assign({}, { role, entity: user }))
      })
      // TODO remove when implemented
      if (!role.groups) return
      role.groups.forEach(group => {
        roleEntities.push(Object.assign({}, { role, entity: group }))
        groups.push(group)
      })
    })
    const sortedRoleEntities = roleEntities.sort(sortUserOrGroup)

    const groupsByStatus = this.setupEntityGroups(sortedRoleEntities, counts)

    const pendingPanelOpen =
      (counts.active === 0 && counts.pending > 0) || status === 'pending'

    this.setState(prevState => ({
      groups,
      groupsByStatus,
      pendingPanelOpen,
      page: {
        pending:
          status === 'pending' || status === 'both'
            ? page
            : prevState.page.pending,
        active:
          status === 'active' || status === 'both'
            ? page
            : prevState.page.active,
        archived:
          status === 'archived' || status === 'both'
            ? page
            : prevState.page.archived,
      },
    }))
  }

  setupEntityGroups = (entities, counts) => [
    {
      panelTitle: 'Pending Invitations',
      status: 'pending',
      count: counts.pending,
      entities: entities.filter(
        role =>
          role.entity.internalType === 'users' &&
          role.entity.status === 'pending'
      ),
    },
    {
      panelTitle: 'Active Users',
      status: 'active',
      count: counts.active,
      entities: entities.filter(
        role =>
          role.entity.internalType !== 'users' ||
          role.entity.status === 'active'
      ),
    },
    {
      panelTitle: 'Archived Users',
      status: 'archived',
      count: counts.archived,
      entities: entities.filter(
        role =>
          role.entity.internalType === 'users' &&
          role.entity.status === 'archived'
      ),
    },
  ]

  updateSearchText = searchText => {
    this.setState({ searchText }, () => {
      this.debouncedInit({ reset: true, page: 1 })
    })
  }

  handleSearchChange = value => {
    this.updateSearchText(value)
  }

  clearSearch = () => this.updateSearchText('')

  deleteRoles = async (role, entity, opts = {}) => {
    const { ownerId, ownerType } = this.props
    const { apiStore } = this.props
    return role.API_delete(entity, ownerId, ownerType, opts).then(res => {
      // We should do a page reload to get the correct user's new org
      if (opts.organizationChange) {
        this.props.routingStore.routeTo('homepage')
        window.location.reload()
      }
      if (!opts.isSwitching) {
        this.initializeRolesAndGroups()
      }
      if (entity.isCurrentUser && ownerType === 'groups') {
        // if you've left a group, reload your groups from the API
        apiStore.loadCurrentUser()
      }
      return {}
    })
  }

  nextPage = status => () => {
    const page = this.state.page[status]
    this.initializeRolesAndGroups({
      status,
      page: page + 1,
    })
  }

  notCurrentUser(entity) {
    // TODO: needs to check group roles too
    if (entity.internalType === 'groups') return true
    const { apiStore } = this.props
    const { currentUser } = apiStore
    return currentUser.id !== entity.id
  }

  get renderEntities() {
    const { canEdit, record, submissionBox, ownerType } = this.props
    const { groupsByStatus } = this.state

    const showEntity = (entity, role) => {
      // content_editor is a "hidden" role for now
      return role.name !== 'content_editor'
    }

    return groupsByStatus.map(group => {
      const { panelTitle, entities, count, status } = group
      if (entities.length === 0) return null

      return (
        <Panel
          key={panelTitle}
          title={`${panelTitle} (${count})`}
          open={status === 'active'}
        >
          <React.Fragment>
            {entities.map(
              combined =>
                showEntity(combined.entity, combined.role) && (
                  <RoleSelect
                    enabled={
                      canEdit &&
                      this.notCurrentUser(combined.entity, combined.role)
                    }
                    key={`${combined.entity.id}_${combined.entity.internalType}_r${combined.role.id}`}
                    record={record}
                    role={combined.role}
                    roleTypes={roleTypes(ownerType)}
                    roleLabels={submissionBox ? { viewer: 'participant' } : {}}
                    entity={combined.entity}
                    onDelete={this.deleteRoles}
                    afterSwitchRoles={() => {
                      this.initializeRolesAndGroups({ reset: true, page: 1 })
                    }}
                  />
                )
            )}
            {entities.length < count && (
              <ShowMoreButton
                disabled={this.loadingMore}
                onClick={this.nextPage(status)}
              >
                {this.loadingMore ? 'Loading...' : 'Show more...'}
              </ShowMoreButton>
            )}
          </React.Fragment>
        </Panel>
      )
    })
  }

  render() {
    const { record, canEdit, title } = this.props
    return (
      <Fragment>
        <PublicSharingOptions
          record={record}
          canEdit={canEdit}
          reloadGroups={() => this.initializeRolesAndGroups()}
        />
        <StyledHeaderRow align="flex-end">
          <Heading3>{title}</Heading3>
          <ExpandableSearchInput
            value={this.state.searchText}
            onChange={this.handleSearchChange}
            onClear={this.clearSearch}
          />
        </StyledHeaderRow>
        <ScrollArea>{this.renderEntities}</ScrollArea>
        {canEdit && (
          <Fragment>
            <Row>
              <FooterBreak />
            </Row>
          </Fragment>
        )}
      </Fragment>
    )
  }
}

RolesMenu.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  canEdit: PropTypes.bool,
  ownerId: PropTypes.string.isRequired,
  ownerType: PropTypes.string.isRequired,
  title: PropTypes.string,
  submissionBox: PropTypes.bool,
  addedNewRole: PropTypes.bool,
}
RolesMenu.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
RolesMenu.defaultProps = {
  canEdit: false,
  title: 'Shared with',
  submissionBox: false,
  addedNewRole: false,
}
RolesMenu.displayName = 'RolesMenu'

export default RolesMenu
