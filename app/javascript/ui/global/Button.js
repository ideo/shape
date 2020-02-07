import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'

const Button = styled.button`
  background-color: ${({ colorScheme }) =>
    colorScheme === 'transparent' ? v.colors.transparent : colorScheme};
  border: ${({ colorScheme }) =>
    colorScheme === 'transparent' ? `1px solid ${v.colors.black}` : 'none'};
  border-radius: 20px;
  color: ${({ colorScheme }) =>
    colorScheme === 'transparent' ? v.colors.black : v.colors.white};
  cursor: pointer;
  font-family: ${v.fonts.sans};
  font-size: ${({ size }) => (size === 'sm' ? 0.75 : 1)}rem;
  font-weight: ${v.weights.medium};
  height: 40px;
  letter-spacing: 0.09375rem;
  min-width: ${({ minWidth }) => minWidth}px;
  text-transform: uppercase;
  transition: all 0.3s;
  width: 183px;

  &:hover,
  &:focus {
    background-color: ${v.colors.commonDark};
    color: ${v.colors.white};
    border: ${({ colorScheme }) =>
      colorScheme === 'transparent'
        ? `1px solid ${v.colors.commonDark}`
        : 'none'};
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
}
Button.defaultProps = {
  colorScheme: v.colors.black,
  size: 'md',
  minWidth: null,
  disabled: false,
}
/** @component */
export default Button
