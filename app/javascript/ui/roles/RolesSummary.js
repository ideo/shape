import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import _ from 'lodash'
import pluralize from 'pluralize'

import Tooltip from '~/ui/global/Tooltip'
import Avatar from '~/ui/global/Avatar'
import v from '~/utils/variables'

const MAX_USERS_TO_SHOW = 4

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

const StyledAvatarGroup = styled.div`
  display: inline-block;
  margin: 0 8px;
  .placeholder,
  .editor,
  .viewer {
    display: inline-block;
    margin-left: 0px;
    margin-right: -12px;
    border: 1px solid ${v.colors.commonLight};
    /* for any transparent avatars */
    background-color: white;
    &:last-child {
      margin-right: 0;
    }
    ${props =>
      _.map(
        _.range(1, 6),
        i =>
          `:nth-child(${i}) {
            z-index: ${10 - i};
          }`
      )};
  }
  .placeholder {
    background-color: ${v.colors.commonMedium};
  }
`
StyledAvatarGroup.displayName = 'StyledAvatarGroup'

const StyledSeparator = styled.div`
  width: 1px;
  height: 32px;
  background-color: ${v.colors.commonMedium};
  display: inline-block;
`

const StyledAddUserBtn = styled.div`
  display: inline-block;
  vertical-align: top;
  margin-right: 0;
  width: 32px;
  height: 32px;
  border-radius: 32px;
  background-color: white;
  color: ${v.colors.black};
  line-height: 32px;
  font-size: 1.5rem;
  text-align: center;
  cursor: pointer;
`
StyledAddUserBtn.displayName = 'StyledAddUserBtn'

const MORE_EDITORS = (
  <Avatar
    title="...and more editors"
    url=""
    className="placeholder"
    displayName
  />
)
const MORE_VIEWERS = (
  <Avatar
    title="...and more viewers"
    url=""
    className="placeholder"
    displayName
  />
)

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
    const { roles } = this.props
    const editorRole = _.find(roles, { name: 'editor' })
    if (!editorRole) return []
    return [...editorRole.users, ...editorRole.groups]
  }

  get viewers() {
    const { roles } = this.props
    const viewerRole = _.find(roles, { name: 'viewer' })
    if (!viewerRole) return []
    return [...viewerRole.users, ...viewerRole.groups]
  }

  // Return at most MAX_USERS_TO_SHOW users,
  // prioritizing editors over viewers
  get viewersAndEditorsLimited() {
    let editors = _.sortBy(this.editors, ['first_name'])
    let viewers = _.sortBy(this.viewers, ['first_name'])
    const editorCount = editors.length
    const viewerCount = viewers.length
    editors = editors.slice(0, MAX_USERS_TO_SHOW)

    if (editors.length < MAX_USERS_TO_SHOW) {
      const numViewers = MAX_USERS_TO_SHOW - editors.length
      viewers = viewers.slice(0, numViewers)
    } else {
      viewers = []
    }

    return { editors, editorCount, viewers, viewerCount }
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
    // If there aren't any editors or viewers, render with add user button
    // If there aren't any editors but are viewers, don't render label/button
    if (editors.length === 0 && !this.props.canEdit) return ''
    if (editors.length === 0 && viewers.length === 0) return ''

    const editorAvatars = editors.map(editor => (
      <Avatar
        key={`${editor.internalType}_${editor.id}`}
        title={editor.nameWithHints || editor.name}
        url={editor.pic_url_square || editor.filestack_file_url}
        className="editor"
        // user_profile_collection_id will be null if its a group
        linkToCollectionId={editor.user_profile_collection_id}
        displayName
      />
    ))

    return (
      <StyledAvatarGroup align="right">
        {editorAvatars}
        {editorCount > MAX_USERS_TO_SHOW && MORE_EDITORS}
      </StyledAvatarGroup>
    )
  }

  get renderViewers() {
    const { viewers, viewerCount } = this.viewersAndEditorsLimited

    if (viewers.length === 0) return ''
    const viewerAvatars = viewers.map(viewer => (
      <Avatar
        key={`${viewer.internalType}_${viewer.id}`}
        title={viewer.nameWithHints || viewer.name}
        url={viewer.pic_url_square || viewer.filestack_file_url}
        className="viewer"
        // user_profile_collection_id will be null if its a group
        linkToCollectionId={viewer.user_profile_collection_id}
        displayName
      />
    ))
    return (
      <StyledAvatarGroup>
        {viewerAvatars}
        {viewerCount > MAX_USERS_TO_SHOW && MORE_VIEWERS}
      </StyledAvatarGroup>
    )
  }

  get addUserBtn() {
    const { canEdit } = this.props
    if (!canEdit) return ''
    return (
      <Tooltip title="Share">
        <StyledAddUserBtn onClick={this.props.handleClick}>+</StyledAddUserBtn>
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
  handleClick: PropTypes.func.isRequired,
  canEdit: PropTypes.bool,
  rolesMenuOpen: PropTypes.bool.isRequired,
}

RolesSummary.defaultProps = {
  roles: [],
  canEdit: false,
}

export default RolesSummary
