import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import v from '~/utils/variables'

const StyledButton = styled.button`
  color: ${v.colors.darkGray};
  &.ql-size-reg {
    font-size: 0.9rem;
    font-family: 'Sentintel', serif;
  }
  &.ql-size-large {
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
      <StyledButton className="ql-size ql-size-reg" value="">T</StyledButton>
      <StyledButton className="ql-size ql-size-large" value="large">T</StyledButton>
      <StyledButton className="ql-link">
        <svg viewBox="0 0 18 18">
          <line className="ql-stroke" x1="7" x2="11" y1="7" y2="11" />
          <path className="ql-even ql-stroke" d="M8.9,4.577a3.476,3.476,0,0,1,.36,4.679A3.476,3.476,0,0,1,4.577,8.9C3.185,7.5,2.035,6.4,4.217,4.217S7.5,3.185,8.9,4.577Z" />
          <path className="ql-even ql-stroke" d="M13.423,9.1a3.476,3.476,0,0,0-4.679-.36,3.476,3.476,0,0,0,.36,4.679c1.392,1.392,2.5,2.542,4.679.36S14.815,10.5,13.423,9.1Z" />
        </svg>
      </StyledButton>
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
