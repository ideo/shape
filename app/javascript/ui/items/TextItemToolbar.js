import ReactDOMServer from 'react-dom/server'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'
import ExpandIcon from '~/ui/icons/ExpandIcon'
import LinkIcon from '~/ui/icons/LinkIcon'
import CommentIcon from '~/ui/icons/CommentIcon'
import { Quill } from 'react-quill'

// see: https://github.com/zenoamaro/react-quill/issues/188#issuecomment-445272662
const icons = Quill.import('ui/icons')
icons.link = () => ReactDOMServer.renderToString(<LinkIcon />)
icons.comment = () => ReactDOMServer.renderToString(<CommentIcon />)

const StyledButton = styled.button`
  color: ${v.colors.commonDark};
  &.ql-format-reg {
    font-family: ${v.fonts.sans};
  }
  &.ql-format-title {
    font-family: ${v.fonts.sans};
    font-size: 1.1rem;
    font-weight: bold;
    text-align: center;
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
      <StyledButton className="ql-size ql-format-reg" value="">
        b
      </StyledButton>

      {props.toggleSize && (
        <React.Fragment>
          <StyledButton
            className={props.activeSizeFormat === 'large' && 'ql-active'}
            onClick={props.toggleSize('large')}
            dangerouslySetInnerHTML={{ __html: icons.header[2] }}
          ></StyledButton>
          <StyledButton
            className={props.activeSizeFormat === 'huge' && 'ql-active'}
            onClick={props.toggleSize('huge')}
            dangerouslySetInnerHTML={{ __html: icons.header[1] }}
          ></StyledButton>
        </React.Fragment>
      )}

      {/* use h5 for title */}
      {props.toggleHeader && (
        <StyledButton
          onClick={props.toggleHeader(5)}
          className="ql-format-title"
        >
          T
        </StyledButton>
      )}
      {/* quill inserts ql-link SVG */}
      <StyledButton className="ql-link">
        <LinkIcon />
      </StyledButton>

      {props.onComment && (
        <StyledButton onClick={props.onComment}>
          <CommentIcon />
        </StyledButton>
      )}
      {props.onExpand && (
        <IconButton onClick={props.onExpand} className="ql-expand">
          <ExpandIcon />
        </IconButton>
      )}
    </span>
  </div>
)
TextItemToolbar.propTypes = {
  onExpand: PropTypes.func,
  onComment: PropTypes.func,
  toggleSize: PropTypes.func,
  toggleHeader: PropTypes.func,
  activeSizeFormat: PropTypes.string,
}
TextItemToolbar.defaultProps = {
  onExpand: null,
  onComment: null,
  toggleSize: null,
  toggleHeader: null,
  activeSizeFormat: null,
}

export default TextItemToolbar
