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
  &.ql-format-huge {
    font-size: 1.3rem;
    font-family: ${v.fonts.sans};
  }
`

function styles(props) {
  const styles = []
  if (!props.fullPageView) {
    styles.top = '-16px'
    styles.background = 'white'
    styles.position = 'sticky'
    styles.marginBottom = '20px'
    styles.zIndex = 100
  }
  return styles
}

const TextItemToolbar = (props) => (
  <div id="quill-toolbar" style={styles(props)}>
    <span className="ql-formats">
      <StyledButton className="ql-header ql-format-reg" value="">T</StyledButton>
      {/* when using H2, quill inserts its own SVG -- couldn't figure out a way around */}
      <StyledButton className="ql-header ql-format-large" value="3">T</StyledButton>
      <StyledButton className="ql-header ql-format-huge" value="1">
        T</StyledButton>
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
  fullPageView: PropTypes.bool,
}
TextItemToolbar.defaultProps = {
  onExpand: null,
  fullPageView: false,
}

export default TextItemToolbar
