import PropTypes from 'prop-types'
import styled from 'styled-components'

import CloseIcon from '~/ui/icons/CloseIcon'
import v from '~/utils/variables'

/** @component */
export const TopRightButton = styled.button`
  position: absolute;
  top: ${props => (props.size === 'sm' ? '5px' : '12px')};
  right: ${props => (props.size === 'sm' ? '10px' : '12px')};
  color: ${props => props.color};
  .icon {
    width: ${props => (props.size === 'sm' ? '12px' : '15px')};
    height: ${props => (props.size === 'sm' ? '12px' : '15px')};
  }

  &:hover {
    color: black;
  }
`
TopRightButton.displayName = 'TopRightButton'

export const CloseButton = ({ onClick, size, color }) => (
  <TopRightButton onClick={onClick} size={size} color={color}>
    <CloseIcon />
  </TopRightButton>
)
CloseButton.propTypes = {
  size: PropTypes.oneOf(['sm', 'lg']),
  onClick: PropTypes.func.isRequired,
  color: PropTypes.oneOf(Object.values(v.colors)),
}
CloseButton.defaultProps = {
  size: 'sm',
  color: v.colors.cloudy,
}

export const CircledIcon = styled.button`
  align-items: center;
  border-radius: 50%;
  display: flex;
  height: 32px;
  justify-content: center;
  position: relative;
  width: 32px;
  ${props => props.active &&
    `background-color: ${v.colors.gray};`}

  &:hover {
    background-color: ${v.colors.gray};
  }

  .icon {
    height: 20px;
    width: 20px;
  }
`
CircledIcon.displayName = 'StyledCircledIcon'

export const NotificationButton = styled.button`
  background-color: ${props => (props.read ? v.colors.gray : v.colors.orange)};
  border-radius: 50%;
  cursor: ${props => (props.read ? 'default' : 'pointer')};
  display: inline-block;
  height: 12px;
  transition: ${v.transitionWithDelay};
  width: 12px;
`
NotificationButton.displayName = 'NotificationButton'
