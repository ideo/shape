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

// need to use forwardRef in order to be wrapped by MUI tooltip
// https://material-ui.com/components/tooltips/#custom-child-element
export const CloseButton = React.forwardRef(
  ({ onClick, size, color, position, ...otherProps }, ref) => (
    <TopRightButton
      onClick={onClick}
      size={size}
      color={color}
      position={position}
      ref={ref}
      {...otherProps}
    >
      <CloseIcon />
    </TopRightButton>
  )
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
CloseButton.displayName = 'CloseButton'

export const CircledIcon = styled.button`
  align-items: center;
  border-radius: 50%;
  display: flex;
  height: 32px;
  justify-content: center;
  position: relative;
  width: 32px;
  ${props => props.active && `background-color: ${v.colors.commonMedium};`}
  &:hover {
    background-color: ${v.colors.commonMedium};
  }

  .icon {
    height: 20px;
    width: 32px;
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
  margin-bottom: ${props => props.marginBottom || 0}px;

  ${props =>
    props.noPadding &&
    `
    padding: 0;
    display: block;
  `}

  svg,
  .icon {
    display: inline-block;
    height: ${props => props.svgSize.height};
    margin-bottom: 2px;
    margin-right: 3px;
    vertical-align: middle;
    width: ${props => props.svgSize.width};
  }
`
NamedActionButton.defaultProps = {
  svgSize: { width: '30px', height: '30px' },
}

/** @component */
export const FormButton = styled.button`
  width: ${props => (props.width ? props.width : 183)}px;
  text-transform: uppercase;
  font-family: ${v.fonts.sans};
  font-size: ${props => props.fontSize}rem;
  font-weight: ${v.weights.medium};
  ${props =>
    props.minWidth &&
    `
    min-width: ${props.minWidth}px;
  `};
  letter-spacing: 0.09375rem;
  height: 40px;
  cursor: pointer;
  border-radius: 20px;
  color: ${props => {
    if (props.transparent) return props.color
    return invertColor(props.color)
  }};
  background-color: ${props => {
    if (props.transparent) return v.colors.transparent
    return props.color
  }};
  border: ${props => {
    if (props.transparent) return `1px solid ${props.color}`
    return 'none'
  }};
  transition: all 0.3s;
  &:hover,
  &:focus {
    background-color: ${props => {
      if (props.transparent && props.filledHover) return v.colors.commonDark
      if (props.disabledHover) return props.color
      if (props.transparent) return v.colors.transparent
      if (props.color === v.colors.primaryDark) return v.colors.primaryDarkest
      return v.colors.commonDark
    }};
    border: ${props => {
      if (props.transparent && props.filledHover)
        return `1px solid ${v.colors.commonDark}`
      if (!props.transparent) return 'none'
      return `1px solid ${invertColor(props.color)}`
    }};
    color: ${props => {
      if (props.transparent && props.filledHover) return v.colors.white
      if (!props.transparent) return v.colors.commonMedium
      return invertColor(props.color)
    }};
  }
  ${props =>
    props.disabled &&
    `background-color: transparent;
      pointer-events: none;
      border: 1px solid ${props.overrideOutlineColor || v.colors.commonMedium};
      color:  ${props.overrideOutlineColor || v.colors.commonMedium};
    `};
`
FormButton.displayName = 'FormButton'
FormButton.defaultProps = {
  fontSize: 1,
  transparent: false,
  color: v.colors.black,
}

/* invert text color for transparent buttons, add colors as you go */
const invertColor = color => {
  switch (color) {
    case v.colors.black:
      return v.colors.white
    case v.colors.commonDark:
      return v.colors.commonLight
    case v.colors.commonMedium:
      return v.colors.black
    case v.colors.white:
      return v.colors.black
    default:
      return v.colors.white
  }
}
