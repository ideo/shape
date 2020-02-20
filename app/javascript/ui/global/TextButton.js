import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'

/**
 * Button that's just text with no background styling.
 */
const TextButton = styled.button`
  text-transform: uppercase;
  max-width: ${props => (props.maxWidth ? `${props.maxWidth}px` : 'none')};
  font-family: ${v.fonts.sans};
  font-size: ${props => props.fontSizeEm}rem;
  font-weight: 500;
  letter-spacing: 0.09375rem;
  cursor: pointer;
  color: ${props => props.color};
  border: none;
  background: none;
`
TextButton.propTypes = {
  /** Color for the button text */
  color: PropTypes.oneOf(Object.values(v.colors)),
  /** Font size in ems for the button text */
  fontSizeEm: PropTypes.number,
  maxWidth: PropTypes.number,
}
TextButton.defaultProps = {
  color: v.colors.commonDarkest,
  fontSizeEm: 0.9375,
  maxWidth: null,
}
TextButton.displayName = 'TextButton'
/** @component */
export default TextButton
