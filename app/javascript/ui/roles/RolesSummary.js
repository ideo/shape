import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import _ from 'lodash'
import pluralize from 'pluralize'

import Tooltip from '~/ui/global/Tooltip'
import Avatar from '~/ui/global/Avatar'
import AvatarGroup, { MAX_AVATARS_TO_SHOW } from '~/ui/global/AvatarGroup'
import v from '~/utils/variables'
import { AddButton } from '~/ui/global/styled/buttons'
import { objectsEqual } from '~/utils/objectUtils'

// TODO: Don't hide this on mobile if it is being used for C∆ Settings tabs
const StyledRolesSummary = styled.div`
  position: relative;
  top: 5px;
  @media only screen and (max-width: ${v.responsive.medBreakpoint - 1}px) {
    min-height: 50px;
    .roles-summary--inner {
      display: none;
    }
  }
`
StyledRolesSummary.displayName = 'StyledRolesSummary'

const StyledSeparator = styled.div`
  width: 1px;
  height: 32px;
  background-color: ${v.colors.commonMedium};
  display: inline-block;
`

@observer
class RolesSummary extends React.Component {
  // NOTE: editors and viewers are stored in state so that searching roles
  // within the menu doesn't affect this list on the fly
  state = {
    editors: [],
    viewers: [],
  }

  componentDidMount() {
    this.initEditorsAndViewers()
  }

  componentDidUpdate(prevProps) {
    const { props } = this
    // don't update the editors/viewers when the rolesMenu is open
    if (props.rolesMenuOpen) {
      return
    }

    // check role change (likely we navigated between different records)
    const roleIds = _.map(props.roles, 'id')
    const prevRoleIds = _.map(prevProps.roles, 'id')
    const rolesChanged = !objectsEqual(roleIds, prevRoleIds)
    // check collaborator change (someone coming/going)
    const collabIds = _.map(props.collaborators, 'id')
    const prevCollabIds = _.map(prevProps.collaborators, 'id')
    const collaboratorsChanged = !objectsEqual(collabIds, prevCollabIds)
    // check if we just closed the rolesMenu
    const rolesMenuClosed = props.rolesMenuOpen !== prevProps.rolesMenuOpen
    // if any of those have changed, re-initialize the list
    if (rolesChanged || collaboratorsChanged || rolesMenuClosed) {
      this.initEditorsAndViewers()
    }
  }

  initEditorsAndViewers() {
    this.setState({
      editors: this.usersAndGroupsForRole('editor'),
      viewers: this.usersAndGroupsForRole('viewer'),
    })
  }

  usersAndGroupsForRole = roleName => {
    const { collaborators, roles } = this.props
    const role = _.find(roles, { name: roleName })
    if (!role) return []
    const sortedUsers = _.sortBy(role.users, 'name')
    const sortedGroups = _.sortBy(role.groups, 'name')
    // collaborators are already sorted by most recent first
    const collaboratorUsers = _.filter(collaborators, v => {
      const can_edit = v.can_edit_collection
      return roleName === 'editor' ? can_edit : !can_edit
    })

    const allUsers = _.uniqBy([...collaboratorUsers, ...sortedUsers], 'id')
    return [...allUsers, ...sortedGroups]
  }

  // Return at most MAX_AVATARS_TO_SHOW users,
  // prioritizing editors over viewers
  get viewersAndEditorsLimited() {
    const { editors, viewers } = this.state
    const editorCount = editors.length
    const viewerCount = viewers.length
    const maxEditors = editors.slice(0, MAX_AVATARS_TO_SHOW)

    let maxViewers = []
    if (maxEditors.length < MAX_AVATARS_TO_SHOW) {
      const numViewers = MAX_AVATARS_TO_SHOW - maxEditors.length
      maxViewers = viewers.slice(0, numViewers)
    }

    return {
      editors: maxEditors,
      editorCount,
      viewers: maxViewers,
      viewerCount,
    }
  }

  roleLabel = roleName => {
    let label = roleName
    const { roles } = this.props
    const role = _.find(roles, { name: roleName })
    if (role && role.label) ({ label } = role)
    if (!role) return ''
    return pluralize(_.startCase(label))
  }

  renderAvatar = (userOrGroup, type) => {
    // the color class creates a box shadow via AvatarGroup styled-component
    const className = `${type}${
      userOrGroup.color ? ` outlined outline-${userOrGroup.color}` : ' bordered'
    }`

    return (
      <Avatar
        key={`${userOrGroup.internalType}_${userOrGroup.id}`}
        title={userOrGroup.nameWithHints || userOrGroup.name}
        url={userOrGroup.pic_url_square || userOrGroup.filestack_file_url}
        className={className}
        // user_profile_collection_id will be null if its a group
        linkToCollectionId={userOrGroup.user_profile_collection_id}
        displayName
      />
    )
  }

  get renderEditors() {
    const { editors, viewers, editorCount } = this.viewersAndEditorsLimited
    // If there aren't any editors or viewers, render with add user button
    // If there aren't any editors but are viewers, don't render label/button
    if (editors.length === 0 && !this.props.canEdit) return ''
    if (editors.length === 0 && viewers.length === 0) return ''

    const editorAvatars = editors.map(editor =>
      this.renderAvatar(editor, 'editor')
    )

    return (
      <AvatarGroup
        align="right"
        avatarCount={editorCount}
        placeholderTitle="...and more editors"
      >
        {editorAvatars}
      </AvatarGroup>
    )
  }

  get renderViewers() {
    const { viewers, viewerCount } = this.viewersAndEditorsLimited

    if (viewers.length === 0) return ''
    const viewerAvatars = viewers.map(viewer =>
      this.renderAvatar(viewer, 'viewer')
    )
    return (
      <AvatarGroup
        avatarCount={viewerCount}
        placeholderTitle="...and more viewers"
      >
        {viewerAvatars}
      </AvatarGroup>
    )
  }

  // TODO: Why not make this a component to pass in?
  get addUserBtn() {
    const { canEdit } = this.props
    console.log('in addUserBtn: ', canEdit)
    if (!canEdit) return ''
    return (
      <Tooltip title={this.props.buttonText}>
        <AddButton onClick={this.props.handleClick}>+</AddButton>
      </Tooltip>
    )
  }

  render() {
    console.log('RolesSummary#render', this.props)
    const { editors, viewers } = this.viewersAndEditorsLimited
    return (
      <StyledRolesSummary>
        <div className="roles-summary--inner">
          {this.renderEditors}
          {editors.length > 0 && viewers.length > 0 ? <StyledSeparator /> : ''}
          {this.renderViewers}
          {this.addUserBtn}
        </div>
      </StyledRolesSummary>
    )
  }
}

RolesSummary.propTypes = {
  roles: MobxPropTypes.arrayOrObservableArray,
  collaborators: MobxPropTypes.arrayOrObservableArray,
  handleClick: PropTypes.func.isRequired,
  canEdit: PropTypes.bool,
  rolesMenuOpen: PropTypes.bool.isRequired,
  buttonText: PropTypes.string, // TODO: Should this be required?
}

RolesSummary.defaultProps = {
  roles: [],
  collaborators: [],
  canEdit: false,
}

export default RolesSummary
