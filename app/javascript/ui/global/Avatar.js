import PropTypes from 'prop-types'
import MuiAvatar from 'material-ui/Avatar'
import styled from 'styled-components'
import Tooltip from '~/ui/global/Tooltip'
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
    const { className, displayName, url, size, title } = this.props
    const renderAvatar = (
      <StyledAvatar
        alt={title}
        size={size}
        className={`avatar ${className}`}
        src={url}
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
        </Tooltip>)
    }
    return content
  }
}

Avatar.propTypes = {
  title: PropTypes.string,
  url: PropTypes.string.isRequired,
  size: PropTypes.number,
  className: PropTypes.string,
  displayName: PropTypes.bool,
}
Avatar.defaultProps = {
  size: 34,
  className: '',
  title: 'Avatar',
  displayName: false,
}

export default Avatar
