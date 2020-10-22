import ReactDOMServer from 'react-dom/server'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import ColorSquare from '~/ui/global/ColorSquare'
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
  color: ${v.colors.commonMedium};
  font-family: ${v.fonts.sans};
  vertical-align: baseline;
  &.ql-format-reg {
    font-size: 14px;
  }
  &.ql-format-huge,
  &.ql-format-title {
    font-size: 20px;
    position: relative;
    top: -4px;
  }
  &.ql-format-huge {
    top: -3px;
  }
  &:hover,
  .ql-active {
    color: ${v.colors.black};
    text-decoration: none;
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
      <StyledButton
        className="ql-size ql-format-reg"
        value=""
        onClick={props.toggleSize && props.toggleSize(null)}
      >
        b
      </StyledButton>

      {props.toggleSize && (
        <React.Fragment>
          <StyledButton
            className={`ql-format-huge ${props.activeSizeFormat === 'huge' &&
              'ql-active'}`}
            onClick={props.toggleSize('huge')}
          >
            b
          </StyledButton>
          <StyledButton
            className={props.activeSizeFormat === 'large' && 'ql-active'}
            onClick={props.toggleSize('large')}
            dangerouslySetInnerHTML={{ __html: icons.header[2] }}
          ></StyledButton>
        </React.Fragment>
      )}

      {/* use h5 for title */}
      {props.toggleHeader && (
        <StyledButton
          onClick={props.toggleHeader(5)}
          className={`ql-format-title ${props.activeSizeFormat === 'title' &&
            'ql-active'}`}
        >
          T
        </StyledButton>
      )}
      {/* ql-link class gives this button the URL link functionality */}
      <StyledButton className="ql-link">
        <LinkIcon />
      </StyledButton>

      {props.onColorChange && (
        <StyledButton onClick={ev => props.onColorChange(ev)}>
          <ColorSquare color={props.backgroundColor} />
        </StyledButton>
      )}

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
  onColorChange: PropTypes.func,
  backgroundColor: PropTypes.string,
  activeSizeFormat: PropTypes.string,
}
TextItemToolbar.defaultProps = {
  onExpand: null,
  onComment: null,
  toggleSize: null,
  toggleHeader: null,
  onColorChange: null,
  activeSizeFormat: null,
  backgroundColor: null,
}

export default TextItemToolbar
