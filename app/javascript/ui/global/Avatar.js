import PropTypes from 'prop-types'
import MuiAvatar from 'material-ui/Avatar'
import styled from 'styled-components'

import v from '~/utils/variables'

const StyledAvatar = styled(MuiAvatar)`
  &.avatar {
    width: ${props => props.size}px;
    margin-left: 5px;
    margin-right: 5px;
    height: ${props => props.size}px;
    cursor: pointer;

    @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
      width: ${props => props.size * 0.8}px;
      height: ${props => props.size * 0.8}px;
    }
  }
`

class Avatar extends React.Component {
  render() {
    const { className, url, size, title } = this.props
    return (
      <StyledAvatar
        alt={title}
        size={size}
        onClick={this.handleClick}
        className={className}
        src={url}
      />
    )
  }
}

Avatar.propTypes = {
  title: PropTypes.string,
  url: PropTypes.string.isRequired,
  size: PropTypes.number,
  className: PropTypes.string,
}
Avatar.defaultProps = {
  size: 34,
  className: 'avatar',
  title: 'Avatar',
}

export default Avatar
