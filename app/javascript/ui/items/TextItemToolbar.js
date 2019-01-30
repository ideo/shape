import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'
import ExpandIcon from '~/ui/icons/ExpandIcon'

const StyledButton = styled.button`
  color: ${v.colors.commonDark};
  &.ql-format-reg {
    font-size: 0.9rem;
    font-family: 'Sentintel', serif;
  }
  &.ql-format-large {
    font-size: 1.1rem;
    font-family: ${v.fonts.sans};
  }
  &.ql-format-huge {
    font-size: 1.3rem;
    font-family: ${v.fonts.sans};
  }
`

const IconButton = styled(StyledButton)`
  margin-bottom: 1px;
  margin-left: auto;
  width: 25px !important;
`

const TextItemToolbar = props => (
  <div id="quill-toolbar">
    <span className="ql-formats">
      <StyledButton className="ql-header ql-format-reg" value="">
        T
      </StyledButton>
      {/* when using H2, quill inserts its own SVG -- couldn't figure out a way around */}
      <StyledButton className="ql-header ql-format-large" value="3">
        T
      </StyledButton>
      <StyledButton className="ql-header ql-format-huge" value="1">
        T
      </StyledButton>
      {/* quill inserts ql-link SVG */}
      <StyledButton className="ql-link" />
      {props.onExpand && (
        <IconButton onClick={props.onExpand}>
          <ExpandIcon />
        </IconButton>
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
