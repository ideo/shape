import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import v from '~/utils/variables'

const StyledButton = styled.button`
  color: ${v.colors.darkGray};
  &.ql-format-reg {
    font-size: 0.9rem;
    font-family: 'Sentintel', serif;
  }
  &.ql-format-large {
    font-size: 1.1rem;
    font-family: 'Gotham', sans-serif;
  }
`

const StyledRightColumn = styled.div`
  position: absolute;
  right: 1rem;
`

const CloseLink = styled(Link)`
  /* add the .close class for more specificity to override quill theme-snow */
  &.close {
    text-decoration: none;
    color: ${v.colors.darkGray};
    &:hover {
      color: ${v.colors.linkHover};
    }
    padding: 0;
    height: auto;
    position: relative;
    top: -6px;
    font-size: 1.75rem;
  }
`

const TextItemToolbar = ({ closePath }) => (
  <div id="quill-toolbar">
    <span className="ql-formats">
      <StyledButton className="ql-header ql-format-reg" value="">T</StyledButton>
      {/* when using H2, quill inserts its own SVG -- couldn't figure out a way around */}
      <StyledButton className="ql-header ql-format-large" value="3">T</StyledButton>
      {/* quill inserts ql-link SVG */}
      <StyledButton className="ql-link" />
    </span>
    <StyledRightColumn className="ql-formats">
      <CloseLink className="close" to={closePath}>
        &times;
      </CloseLink>
    </StyledRightColumn>
  </div>
)

TextItemToolbar.propTypes = {
  closePath: PropTypes.string.isRequired,
}

export default TextItemToolbar
