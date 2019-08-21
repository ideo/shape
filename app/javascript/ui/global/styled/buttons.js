import PropTypes from 'prop-types'
import styled from 'styled-components'

import CloseIcon from '~/ui/icons/CloseIcon'
import v from '~/utils/variables'

/** @component */
export const TopRightButton = styled.button`
  position: ${props => props.position};
  top: ${props => (props.size === 'sm' ? '8px' : '12px')};
  right: ${props => (props.size === 'sm' ? '12px' : '12px')};
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

export const CloseButton = ({
  onClick,
  size,
  color,
  position,
  ...otherProps
}) => (
  <TopRightButton
    onClick={onClick}
    size={size}
    color={color}
    position={position}
    {...otherProps}
  >
    <CloseIcon />
  </TopRightButton>
)
CloseButton.propTypes = {
  size: PropTypes.oneOf(['sm', 'lg']),
  onClick: PropTypes.func.isRequired,
  position: PropTypes.oneOf(['absolute', 'fixed']),
  color: PropTypes.oneOf(Object.values(v.colors)),
}
CloseButton.defaultProps = {
  size: 'sm',
  color: v.colors.commonDark,
  position: 'absolute',
}

export const CircledIcon = styled.button`
  align-items: center;
  border-radius: 50%;
  display: flex;
  height: 32px;
  justify-content: center;
  position: relative;
  width: 32px;
  ${props =>
    props.active && `background-color: ${v.colors.commonMedium};`} &:hover {
    background-color: ${v.colors.commonMedium};
  }

  .icon {
    height: 20px;
    width: 20px;
  }
`
CircledIcon.displayName = 'StyledCircledIcon'

export const NotificationButton = styled.button`
  background-color: ${props =>
    props.read ? v.colors.commonMedium : v.colors.alert};
  border-radius: 50%;
  cursor: ${props => (props.read ? 'default' : 'pointer')};
  display: inline-block;
  height: 12px;
  transition: ${v.transitionWithDelay};
  width: 12px;
`
NotificationButton.displayName = 'NotificationButton'

export const AddButton = styled.div`
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
AddButton.displayName = 'AddButton'

export const LeaveButton = styled.button`
  margin-top: 8px;
  width: 16px;
`
LeaveButton.displayName = 'StyledLeaveIconHolder'

export const NamedActionButton = styled.button`
  background: transparent;
  color: ${v.colors.black};
  font-family: ${v.fonts.sans};
  font-size: 0.75rem;
  font-weight: ${v.weights.medium};
  letter-spacing: 0.0625rem;
  padding: 16px 8px;
  text-transform: uppercase;

  svg,
  .icon {
    display: inline-block;
    height: 30px;
    margin-bottom: 2px;
    vertical-align: middle;
    width: 30px;
  }
`
/* eslint-disable no-nested-ternary */
/** @component */
export const FormButton = styled.button`
  width: ${props => (props.width ? props.width : 183)}px;
  text-transform: uppercase;
  font-family: ${v.fonts.sans};
  font-size: ${props => (props.fontSize ? props.fontSize : 1)}rem;
  font-weight: ${v.weights.medium};
  letter-spacing: 0.09375rem;
  height: 40px;
  cursor: pointer;
  border-radius: 20px;
  color: ${props => {
    switch (props.color) {
      case v.colors.transparent:
        return v.colors.black
      default:
        return 'white'
    }
  }};
  background-color: ${props => props.color};
  border: ${props =>
    props.color === v.colors.transparent
      ? `1px solid ${v.colors.black}`
      : 'none'};
  transition: all 0.3s;
  &:hover,
  &:focus {
    background-color: ${props =>
      props.disabledHover
        ? props.color
        : props.color === v.colors.primaryDark
        ? v.colors.primaryDarkest
        : v.colors.commonDark};
  }
  ${props =>
    props.disabled &&
    `background-color: transparent;
      border: 1px solid ${props.overrideOutlineColor || v.colors.commonMedium};
      color:  ${props.overrideOutlineColor || v.colors.commonMedium};
      cursor: initial;
      &:hover, &:focus {
        background-color: transparent;
      }
    `};
`
FormButton.displayName = 'FormButton'
FormButton.defaultProps = {
  color: v.colors.black,
}

/** @component */
export const TextButton = styled.button`
  text-transform: uppercase;
  font-family: ${v.fonts.sans};
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: 0.09375rem;
  cursor: pointer;
  max-width: ${props => (props.maxWidth ? `${props.maxWidth}px` : 'none')};
`
TextButton.displayName = 'StyledTextButton'
