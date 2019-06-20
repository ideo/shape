import PropTypes from 'prop-types'
import MuiAvatar from '@material-ui/core/Avatar'
import styled from 'styled-components'

import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'

const StyledAvatar = styled(MuiAvatar)`
  &.avatar {
    background: ${({ backgroundcolor }) => backgroundcolor};
    box-sizing: border-box;
    color: ${({ color }) => color};
    cursor: pointer;
    height: ${({ size }) => size}px;
    margin-left: 5px;
    margin-right: 5px;
    overflow: visible;
    padding: 3px;
    width: ${({ size }) => size}px;

    @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    }
  }
`

class IconAvatar extends React.Component {
  render() {
    const {
      backgroundColor,
      children,
      className,
      color,
      onClick,
      size,
      title,
    } = this.props
    const renderAvatar = (
      <StyledAvatar
        alt={title}
        // named lowercase to get around React DOM props warning
        backgroundcolor={backgroundColor}
        className={`avatar ${className}`}
        color={color}
        onClick={onClick}
        size={size}
        data-cy={this.props['data-cy']}
      >
        {children}
      </StyledAvatar>
    )
    let content = renderAvatar
    if (title) {
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

IconAvatar.propTypes = {
  backgroundColor: PropTypes.oneOf(Object.values(v.colors)),
  color: PropTypes.oneOf(Object.values(v.colors)),
  children: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func,
  size: PropTypes.number,
  title: PropTypes.string,
  'data-cy': PropTypes.string,
}
IconAvatar.defaultProps = {
  backgroundColor: v.colors.secondaryDark,
  color: v.colors.white,
  children: null,
  className: '',
  onClick: () => {},
  size: 32,
  title: null,
  'data-cy': null,
}

export default IconAvatar
