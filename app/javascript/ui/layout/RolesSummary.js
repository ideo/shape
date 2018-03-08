import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'
import UserAvatar from './UserAvatar'

const MAX_USERS_TO_SHOW = 5

const StyledAvatarGroup = styled.div`
  display: inline-block;
  margin: 0 12px;
  .title {
    font-family: 'Gotham';
    text-align: ${props => props.align || 'left'};
    color: ${v.colors.cloudy};
    font-size: 1rem;
    font-weight: 100;
    margin: 0 0 6px 0;
  }
`
StyledAvatarGroup.displayName = 'StyledAvatarGroup'

const StyledUser = styled.div`
  display: inline-block;
  margin-right: 12px;
  &:last-of-type {
    margin-right: 0;
  }
  div {
    width: 30px;
    height: 30px;
  }
`

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
  // Return at most MAX_USERS_TO_SHOW users,
  // prioritizing editors over viewers
  get viewersAndEditorsLimited() {
    let { editors, viewers } = this.props
    editors = editors.slice(0, MAX_USERS_TO_SHOW - 1)

    if (editors.length < MAX_USERS_TO_SHOW) {
      const numViewers = MAX_USERS_TO_SHOW - editors.length
      viewers = viewers.slice(0, numViewers - 1)
    } else {
      viewers = []
    }

    return { editors, viewers }
  }

  get addUserBtn() {
    return (
      <StyledAddUserBtn
        onClick={this.props.handleClick}
      >+</StyledAddUserBtn>
    )
  }

  get renderEditors() {
    const { editors, viewers } = this.viewersAndEditorsLimited

    if (editors.length === 0) return ''

    const editorAvatars = editors.map(editor => (
      <StyledUser key={editor.id}>
        <UserAvatar user={editor} />
      </StyledUser>
    ))

    return (
      <StyledAvatarGroup align="right">
        <div className="title">Editors</div>
        {(editors.length > 0 || viewers.length === 0) ? this.addUserBtn : ''}
        {editorAvatars}
      </StyledAvatarGroup>
    )
  }

  get renderViewers() {
    const { viewers, editors } = this.viewersAndEditorsLimited

    if (viewers.length === 0) return ''

    const viewerAvatars = viewers.map(viewer => (
      <StyledUser key={viewer.id}>
        <UserAvatar user={viewer} />
      </StyledUser>
    ))
    return (
      <StyledAvatarGroup>
        <div className="title">Viewers</div>
        {editors.length === 0 ? this.addUserBtn : ''}
        {viewerAvatars}
      </StyledAvatarGroup>
    )
  }

  render() {
    const { editors, viewers } = this.viewersAndEditorsLimited
    return (
      <div className={this.props.className}>
        {(editors.length === 0 && viewers.length === 0) ? this.addUserBtn : ''}
        {this.renderEditors}
        {(editors.length > 0 && viewers.length > 0) ? <StyledSeparator /> : ''}
        {this.renderViewers}
      </div>
    )
  }
}

RolesSummary.propTypes = {
  editors: MobxPropTypes.arrayOrObservableArray.isRequired,
  viewers: MobxPropTypes.arrayOrObservableArray.isRequired,
  handleClick: PropTypes.func.isRequired,
  className: PropTypes.string
}

RolesSummary.defaultProps = {
  className: ''
}

export default RolesSummary
