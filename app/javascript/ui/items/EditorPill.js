import PropTypes from 'prop-types'
import { Fragment } from 'react'
import styled from 'styled-components'

import v from '~/utils/variables'
import Avatar from '~/ui/global/Avatar'

const StyledEditorPill = styled.div`
  position: fixed;
  top: ${v.headerHeight - 25}px;
  left: 50%;
  transform: translateX(-50%);
  z-index: ${v.zIndex.pageHeader};

  min-width: 400px;
  min-height: 40px;
  border-radius: 5px;
  background-color: ${v.colors.cloudy};
  padding: 10px 20px;
  color: white;

  opacity: 1;
  transition: min-height 0.3s ease-out, opacity 0.3s ease-out;
  &.hidden {
    opacity: 0;
    min-height: 1px;
    transition: min-height 0.3s ease-out, opacity 0.3s ease-out, z-index 0.5s 0.5s;
    z-index: -1;
  }
  .editor {
    display: inline-block;
  }
  .name {
    margin-left: 12px;
    display: inline-block;
    font-family: ${v.fonts.sans};
    font-size: 1.1rem;
    letter-spacing: 0.075rem;
    vertical-align: top;
    line-height: 40px;
    text-transform: uppercase;
  }
`

class EditorPill extends React.PureComponent {
  render() {
    const { editor, className } = this.props
    return (
      <StyledEditorPill className={className}>
        { editor.name &&
          <Fragment>
            <Avatar
              title={editor.name}
              url={editor.pic_url_square}
              size={38}
              className="editor"
            />
            <div className="name">
              {editor.name} (Editing...)
            </div>
          </Fragment>
        }
      </StyledEditorPill>
    )
  }
}

EditorPill.propTypes = {
  editor: PropTypes.shape({
    name: PropTypes.string,
    pic_url_square: PropTypes.string,
  }).isRequired,
  className: PropTypes.string
}

EditorPill.defaultProps = {
  className: ''
}

export default EditorPill
