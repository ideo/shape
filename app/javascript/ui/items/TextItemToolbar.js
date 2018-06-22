import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'
import ExpandIcon from '~/ui/icons/ExpandIcon'

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

const styles = {
  top: '-16px',
  background: 'white',
  position: 'sticky',
  marginBottom: '20px',
  zIndex: 100,
}

const TextItemToolbar = (props) => (
  <div id="quill-toolbar" style={styles}>
    <span className="ql-formats">
      <StyledButton className="ql-header ql-format-reg" value="">T</StyledButton>
      {/* when using H2, quill inserts its own SVG -- couldn't figure out a way around */}
      <StyledButton className="ql-header ql-format-large" value="3">T</StyledButton>
      <StyledButton className="ql-header ql-format-huge" value="1">T</StyledButton>
      {/* quill inserts ql-link SVG */}
      <StyledButton className="ql-link" />
      {props.onExpand && (
        <StyledButton onClick={props.onExpand}>
          <ExpandIcon />
        </StyledButton>
      )}
    </span>
  </div>
)
TextItemToolbar.propTypes = {
  onExpand: PropTypes.func,
}
TextItemToolbar.defaultProps = {
  onExpand: null,
}

export default TextItemToolbar
