import styled from 'styled-components'

import v from '~/utils/variables'

const StyledButton = styled.button`
  color: ${v.colors.cloudy};
  &.ql-format-reg {
    font-size: 0.9rem;
    font-family: 'Sentintel', serif;
  }
  &.ql-format-large {
    font-size: 1.1rem;
    font-family: ${v.fonts.sans};
  }
`

const TextItemToolbar = () => (
  <div id="quill-toolbar">
    <span className="ql-formats">
      <StyledButton className="ql-header ql-format-reg" value="">T</StyledButton>
      {/* when using H2, quill inserts its own SVG -- couldn't figure out a way around */}
      <StyledButton className="ql-header ql-format-large" value="3">T</StyledButton>
      {/* quill inserts ql-link SVG */}
      <StyledButton className="ql-link" />
    </span>
  </div>
)

export default TextItemToolbar
