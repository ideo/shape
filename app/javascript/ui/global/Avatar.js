import { observable, action } from 'mobx'
import { observer } from 'mobx-react'
import PropTypes from 'prop-types'
import MuiAvatar from '@material-ui/core/Avatar'
import styled from 'styled-components'

import { routingStore } from '~/stores'
import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'

const StyledAvatar = styled(MuiAvatar)`
  &.avatar {
    width: ${props => props.size}px;
    margin-left: 5px;
    margin-right: 5px;
    height: ${props => props.size}px;
    cursor: ${props => props.cursor};

    ${props =>
      props.responsive &&
      `
      @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
        width: ${props.size * 0.8}px;
        height: ${props.size * 0.8}px;
      }
    `};
  }
`

@observer
class Avatar extends React.Component {
  @observable
  error = false

  @action
  setError(val) {
    this.error = val
  }

  get url() {
    if (this.error) {
      return Avatar.defaultProps.url
    }
    return this.props.url
  }

  onError = () => {
    this.setError(true)
  }

  handleClick = () => {
    const { linkToCollectionId } = this.props
    if (!linkToCollectionId) return false
    return routingStore.routeTo('collections', linkToCollectionId)
  }

  render() {
    const {
      className,
      displayName,
      size,
      title,
      linkToCollectionId,
      responsive,
    } = this.props
    const renderAvatar = (
      <StyledAvatar
        alt={title}
        size={size}
        className={`avatar ${className}`}
        src={this.url}
        imgProps={{ onError: this.onError }}
        onClick={this.handleClick}
        cursor={linkToCollectionId || displayName ? 'pointer' : 'initial'}
        responsive={responsive ? 1 : 0}
      />
    )
    let content = renderAvatar
    if (displayName) {
      content = (
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title={title}
          placement="bottom"
        >
          {renderAvatar}
        </Tooltip>
      )
    }
    return content
  }
}

Avatar.propTypes = {
  title: PropTypes.string,
  url: PropTypes.string,
  size: PropTypes.number,
  className: PropTypes.string,
  displayName: PropTypes.bool,
  linkToCollectionId: PropTypes.string,
  responsive: PropTypes.bool,
}
Avatar.defaultProps = {
  url:
    'https://d3none3dlnlrde.cloudfront.net/assets/users/avatars/missing/square.jpg',
  size: 32,
  className: '',
  title: 'Avatar',
  displayName: false,
  linkToCollectionId: null,
  responsive: true,
}

export default Avatar
