import PropTypes from 'prop-types'
// import { EditorState, convertToRaw } from 'draft-js'
import Editor from 'draft-js-plugins-editor'
import createMentionPlugin, { defaultSuggestionsFilter } from 'draft-js-mention-plugin'
import styled from 'styled-components'
import 'draft-js-mention-plugin/lib/plugin.css'

const StyledDiv = styled.div`
  cursor: text;
  padding: 10px;
  padding-right: 45px;
  font-size: 1rem;

  .public-DraftEditor-content {
    min-height: 40px;
  }
`

const mentions = [
  {
    id: 1,
    type: 'user',
    name: 'Matthew Russell',
    handle: 'matthew',
    avatar: 'https://pbs.twimg.com/profile_images/517863945/mattsailing_400x400.jpg',
  },
  {
    name: 'Julian Krispel-Samsel',
    handle: 'julian',
    avatar: 'https://avatars2.githubusercontent.com/u/1188186?v=3&s=400',
  },
  {
    name: 'Jyoti Puri',
    handle: 'jyoti99',
    avatar: 'https://avatars0.githubusercontent.com/u/2182307?v=3&s=400',
  },
  {
    name: 'Max Stoiber',
    handle: 'maxymax',
    avatar: 'https://pbs.twimg.com/profile_images/763033229993574400/6frGyDyA_400x400.jpg',
  },
  {
    name: 'Nik Graf',
    handle: 'nikko',
    avatar: 'https://avatars0.githubusercontent.com/u/223045?v=3&s=400',
  },
  {
    name: 'Pascal Brandt',
    handle: 'pascalb',
    avatar: 'https://pbs.twimg.com/profile_images/688487813025640448/E6O6I011_400x400.png',
  },
]

class CommentInput extends React.Component {
  constructor(props) {
    super(props)
    this.mentionPlugin = createMentionPlugin({
      mentionComponent: (mentionProps) => (
        <strong>
          @{mentionProps.mention.handle}
        </strong>
      )
    })
  }

  state = {
    suggestions: mentions,
  }

  onSearchChange = ({ value }) => {
    this.setState({
      // TODO: replace default search to also search on handle
      suggestions: defaultSuggestionsFilter(value, mentions),
    })
  }

  onAddMention = () => {
    // get the mention object selected
  }

  focus = () => {
    this.editor.focus()
  }

  render() {
    const { onChange, editorState } = this.props
    const { MentionSuggestions } = this.mentionPlugin
    const plugins = [this.mentionPlugin]

    return (
      <StyledDiv onClick={this.focus}>
        <Editor
          editorState={editorState}
          onChange={onChange}
          plugins={plugins}
          ref={(element) => { this.editor = element }}
        />
        <MentionSuggestions
          onSearchChange={this.onSearchChange}
          suggestions={this.state.suggestions}
          onAddMention={this.onAddMention}
        />
      </StyledDiv>
    )
  }
}

CommentInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  editorState: PropTypes.object.isRequired,
}

export default CommentInput
