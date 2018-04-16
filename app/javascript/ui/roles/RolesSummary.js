import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'
import Avatar from '~/ui/global/Avatar'

const MAX_USERS_TO_SHOW = 5
const AVATAR_SIZE = 30

const StyledRolesSummary = styled.div`
  position: relative;
`
StyledRolesSummary.displayName = 'StyledRolesSummary'

const StyledAvatarGroup = styled.div`
  display: inline-block;
  margin: 0 12px;
  .editor,
  .viewer {
    display: inline-block;
    margin-right: 12px;
    &:last-of-type {
      margin-right: 0;
    }
  }
`
StyledAvatarGroup.displayName = 'StyledAvatarGroup'

const StyledRoleTitle = styled.div`
  font-family: ${v.fonts.sans};
  text-align: ${props => props.align || 'left'};
  color: ${v.colors.cloudy};
  font-size: 1rem;
  font-weight: ${v.weights.book};
  margin: 0 0 6px 0;
`
StyledRoleTitle.displayName = 'StyledRoleTitle'

const StyledSeparator = styled.div`
  width: 1px;
  height: 30px;
  background-color: ${v.colors.cloudy};
  display: inline-block;
`

const StyledAddUserBtn = styled.div`
  display: inline-block;
  vertical-align: top;
  margin-right: 12px;
  width: 30px;
  height: 30px;
  border-radius: 30px;
  background-color: white;
  color: ${v.colors.gray};
  line-height: 30px;
  font-size: 1.5rem;
  text-align: center;
  cursor: pointer;
`
StyledAddUserBtn.displayName = 'StyledAddUserBtn'

class RolesSummary extends React.PureComponent {
  get editors() {
    const { roles } = this.props
    const editorRole = roles.find(role => role.name === 'editor')
    if (!editorRole) return []
    return [...editorRole.users, ...editorRole.groups]
  }

  get viewers() {
    const { roles } = this.props
    const viewerRole = roles.find(role => role.name === 'viewer')
    if (!viewerRole) return []
    return [...viewerRole.users, ...viewerRole.groups]
  }

  // Return at most MAX_USERS_TO_SHOW users,
  // prioritizing editors over viewers
  get viewersAndEditorsLimited() {
    let { editors, viewers } = this
    editors = editors.slice(0, MAX_USERS_TO_SHOW)

    if (editors.length < MAX_USERS_TO_SHOW) {
      const numViewers = MAX_USERS_TO_SHOW - editors.length
      viewers = viewers.slice(0, numViewers)
    } else {
      viewers = []
    }

    return { editors, viewers }
  }

  get renderEditors() {
    const { editors, viewers } = this.viewersAndEditorsLimited
    // If there aren't any editors or viewers, render with add user button
    // If there aren't any editors but are viewers, don't render label/button
    if (editors.length === 0 && viewers.length > 0) return ''

    const editorAvatars = editors.map(editor => (
      <Avatar
        key={`${editor.internalType}_${editor.id}`}
        title={editor.name}
        url={editor.pic_url_square || editor.filestack_file_url}
        size={AVATAR_SIZE}
        className="editor"
      />
    ))

    return (
      <StyledAvatarGroup align="right">
        <StyledRoleTitle>Editors</StyledRoleTitle>
        {(editors.length > 0 || viewers.length === 0) ? this.addUserBtn : ''}
        {editorAvatars}
      </StyledAvatarGroup>
    )
  }

  get renderViewers() {
    const { viewers, editors } = this.viewersAndEditorsLimited

    if (viewers.length === 0) return ''
    const viewerAvatars = viewers.map(viewer => (
      <Avatar
        key={`${viewer.internalType}_${viewer.id}`}
        title={viewer.name}
        url={viewer.pic_url_square || viewer.filestack_file_url}
        size={AVATAR_SIZE}
        className="viewer"
      />
    ))
    return (
      <StyledAvatarGroup>
        <StyledRoleTitle>Viewers</StyledRoleTitle>
        {editors.length === 0 ? this.addUserBtn : ''}
        {viewerAvatars}
      </StyledAvatarGroup>
    )
  }

  get addUserBtn() {
    const { canEdit } = this.props
    if (!canEdit) return ''
    return (
      <StyledAddUserBtn
        onClick={this.props.handleClick}
      >+</StyledAddUserBtn>
    )
  }

  render() {
    const { editors, viewers } = this.viewersAndEditorsLimited
    return (
      <StyledRolesSummary className={this.props.className}>
        {this.renderEditors}
        {(editors.length > 0 && viewers.length > 0) ? <StyledSeparator /> : ''}
        {this.renderViewers}
      </StyledRolesSummary>
    )
  }
}

RolesSummary.propTypes = {
  roles: MobxPropTypes.arrayOrObservableArray.isRequired,
  handleClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  canEdit: PropTypes.bool,
}

RolesSummary.defaultProps = {
  className: '',
  canEdit: false,
}

export default RolesSummary
