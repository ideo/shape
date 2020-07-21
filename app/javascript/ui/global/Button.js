import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'

const Button = styled.button`
  background-color: ${({ colorScheme, outline }) => {
    let color = outline ? v.colors.transparent : colorScheme
    if (colorScheme === v.colors.white) {
      // Note: add background color for white colorScheme to be visible
      color = `rgba(0, 0, 0, 0.15)`
    }
    return color
  }};
  border-color: ${({ colorScheme }) => `${colorScheme}`};
  border-style: solid;
  border-width: 1px;
  border-radius: 20px;
  color: ${({ colorScheme, outline }) =>
    outline ? colorScheme : v.colors.white};
  cursor: pointer;
  font-family: ${v.fonts.sans};
  font-size: ${({ size }) => (size === 'sm' ? 0.75 : 1)}rem;
  font-weight: ${v.weights.medium};
  height: 40px;
  letter-spacing: 0.09375rem;
  min-width: ${({ minWidth }) => minWidth}px;
  text-transform: uppercase;
  transition: all 0.3s;
  width: ${({ width }) => (width ? width : 183)}px;

  &:hover {
    background-color: ${v.colors.commonDark};
    color: ${v.colors.white};
    border-color: ${v.colors.commonDark};
  }
  ${props =>
    props.disabled &&
    `background-color: transparent;
      pointer-events: none;
      border: 1px solid ${v.colors.commonMedium};
      color:  ${v.colors.commonMedium};
    `};
`

Button.displayName = 'Button'
Button.propTypes = {
  /** The color scheme of the button which can be the outline button or any
   * of the colors */
  colorScheme: PropTypes.oneOf([...Object.values(v.colors), 'transparent']),
  /** The size of mainly the text in the button */
  size: PropTypes.oneOf(['sm', 'md']),
  /** Set a minimum width for the button if it's supposed to be a certain size */
  minWidth: PropTypes.number,
  /** Disable the button from being clicked, also rendering a disabled style */
  disabled: PropTypes.bool,
  /** Outline */
  outline: PropTypes.bool,
}
Button.defaultProps = {
  colorScheme: v.colors.black,
  size: 'md',
  minWidth: null,
  disabled: false,
  outline: false,
}
/** @component */
export default Button
