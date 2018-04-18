import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'
import UserAvatar from '~/ui/users/UserAvatar'

const StyledEditorPill = styled.div`
  min-width: 400px;
  border-radius: 5px;
  background-color: ${v.colors.cloudy};
  padding: 10px 20px;
  color: white;
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
        <UserAvatar
          user={editor}
          size={38}
          className="editor"
        />
        <div className="name">
          {editor.name} (Editing...)
        </div>
      </StyledEditorPill>
    )
  }
}

EditorPill.propTypes = {
  editor: PropTypes.shape({
    name: PropTypes.string.isRequired,
    pic_url_square: PropTypes.string.isRequired
  }).isRequired,
  className: PropTypes.string
}

EditorPill.defaultProps = {
  className: ''
}

export default EditorPill
