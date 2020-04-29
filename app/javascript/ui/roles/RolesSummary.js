import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import _ from 'lodash'
import pluralize from 'pluralize'

import Tooltip from '~/ui/global/Tooltip'
import Avatar from '~/ui/global/Avatar'
import AvatarGroup, { MAX_AVATARS_TO_SHOW } from '~/ui/global/AvatarGroup'
import v from '~/utils/variables'
import { AddButton } from '~/ui/global/styled/buttons'
import { uiStore } from '~/stores'

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

// NOTE: intentionally not an observer so that searching roles within the menu doesn't affect this list on the fly
// however it will automatically update after you close the RolesModal
class RolesSummary extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    // while the rolesMenu is open, the users/groups attached to roles might be changing (e.g. searching)
    // and we want the RolesSummary to ignore all that (see note above)
    if (nextProps.rolesMenuOpen) return false
    return true
  }

  get editors() {
    const { collaborators, roles } = this.props
    const editorRole = _.find(roles, { name: 'editor' })
    if (!editorRole) return []
    const allEditors = _.sortBy(
      [...editorRole.users, ...editorRole.groups],
      ['first_name']
    )
    const collaboratorEditors = _.sortBy(
      _.filter(collaborators, v => {
        return v.can_edit_collection
      }),
      e => {
        return new Date(e.timestamp)
      }
    ).reverse()
    return _.uniqBy([...collaboratorEditors, ...allEditors], 'id')
  }

  get viewers() {
    const { collaborators, roles } = this.props
    const viewerRole = _.find(roles, { name: 'viewer' })
    if (!viewerRole) return []
    const allViewers = _.sortBy(
      [...viewerRole.users, ...viewerRole.groups],
      ['first_name']
    )

    const collaboratorViewers = _.sortBy(
      _.filter(collaborators, v => {
        return !v.can_edit_collection
      }),
      e => {
        return new Date(e.timestamp)
      }
    ).reverse()

    return _.uniqBy([...collaboratorViewers, ...allViewers], 'id')
  }

  // Return at most MAX_AVATARS_TO_SHOW users,
  // prioritizing editors over viewers
  get viewersAndEditorsLimited() {
    const { editors, viewers } = this
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

  get renderEditors() {
    const { editors, viewers, editorCount } = this.viewersAndEditorsLimited
    const { collaboratorColorsPrimary } = uiStore
    // If there aren't any editors or viewers, render with add user button
    // If there aren't any editors but are viewers, don't render label/button
    if (editors.length === 0 && !this.props.canEdit) return ''
    if (editors.length === 0 && viewers.length === 0) return ''

    const editorAvatars = editors.map(editor => {
      const borderColor = collaboratorColorsPrimary[editor.id]
      const border = borderColor ? `4px solid ${borderColor}` : 'none'

      return (
        <Avatar
          key={`${editor.internalType}_${editor.id}`}
          title={editor.nameWithHints || editor.name}
          url={editor.pic_url_square || editor.filestack_file_url}
          className="editor"
          // user_profile_collection_id will be null if its a group
          linkToCollectionId={editor.user_profile_collection_id}
          displayName
          border={border}
        />
      )
    })

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
    const { collaboratorColorsPrimary } = uiStore

    if (viewers.length === 0) return ''
    const viewerAvatars = viewers.map(viewer => {
      const borderColor = collaboratorColorsPrimary[viewer.id]
      const border = borderColor ? `4px solid ${borderColor}` : 'none'

      return (
        <Avatar
          key={`${viewer.internalType}_${viewer.id}`}
          title={viewer.nameWithHints || viewer.name}
          url={viewer.pic_url_square || viewer.filestack_file_url}
          className="viewer"
          // user_profile_collection_id will be null if its a group
          linkToCollectionId={viewer.user_profile_collection_id}
          displayName
          border={border}
        />
      )
    })
    return (
      <AvatarGroup
        avatarCount={viewerCount}
        placeholderTitle="...and more viewers"
      >
        {viewerAvatars}
      </AvatarGroup>
    )
  }

  get addUserBtn() {
    const { canEdit } = this.props
    if (!canEdit) return ''
    return (
      <Tooltip title="Share">
        <AddButton onClick={this.props.handleClick}>+</AddButton>
      </Tooltip>
    )
  }

  render() {
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
}

RolesSummary.defaultProps = {
  roles: [],
  collaborators: [],
  canEdit: false,
}

export default RolesSummary
