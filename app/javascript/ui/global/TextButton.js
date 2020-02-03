import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'

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
  color: PropTypes.oneOf(Object.values(v.colors)),
  fontSizeEm: PropTypes.number,
  maxWidth: PropTypes.number,
}
TextButton.defaultProps = {
  color: v.colors.commonDarkest,
  fontSizeEm: 0.9375,
  maxWidth: null,
}
TextButton.displayName = 'StyledTextButton'
export default TextButton
