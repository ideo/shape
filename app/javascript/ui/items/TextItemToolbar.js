import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'
import ExpandIcon from '~/ui/icons/ExpandIcon'

const StyledButton = styled.button`
  color: ${v.colors.commonDark};
  &.ql-format-reg {
    font-family: ${v.fonts.sans};
  }
  &.ql-format-title {
    font-family: ${v.fonts.sans};
    font-size: 1.5rem;
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
        b
      </StyledButton>
      <StyledButton
        className="ql-header ql-format-large"
        value="2"
      ></StyledButton>
      <StyledButton
        className="ql-header ql-format-huge"
        value="1"
      ></StyledButton>
      {/* use h5 for title */}
      <StyledButton className="ql-header ql-format-title" value="5">
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
