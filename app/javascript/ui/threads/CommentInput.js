import _ from 'lodash'
import PropTypes from 'prop-types'
import { observable, action } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
// import { EditorState, convertToRaw } from 'draft-js'
import Editor from 'draft-js-plugins-editor'
import createMentionPlugin from 'draft-js-mention-plugin'

import { uiStore } from '~/stores'
import { StyledCommentInput, CustomMentionSuggestion } from './CustomCommentMentions'

const positionSuggestions = ({ decoratorRect, state, props }) => {
  let transform
  let transition
  let top = '-36px'

  if (state.isActive && props.suggestions.length > 0) {
    transform = `scaleY(1)`
    transition = 'all 0.25s cubic-bezier(.3,1.2,.2,1)'
    const { y } = uiStore.activityLogPosition
    top = `${decoratorRect.top - (y + (45 * (props.suggestions.length + 1)))}px`
  } else if (state.isActive) {
    transform = 'scaleY(0)'
    transition = 'all 0.25s cubic-bezier(.3,1,.2,1)'
  }

  return {
    transform,
    transition,
    top,
  }
}

@inject('apiStore')
@observer
class CommentInput extends React.Component {
  @observable suggestions = []

  constructor(props) {
    super(props)
    this.initMentionPlugin()
    this.searchUsersAndGroups = _.debounce(this._searchUsersAndGroups, 300)
  }

  initMentionPlugin() {
    this.mentionPlugin = createMentionPlugin({
      mentionComponent: (mentionProps) => (
        <strong>
          @{mentionProps.mention.handle}
        </strong>
      ),
      positionSuggestions,
    })
  }

  @action handleClose = () => {
    this.props.onCloseSuggestions()
    this.suggestions = []
  }

  onSearchChange = ({ value }) => {
    this.searchUsersAndGroups(value)
  }

  _searchUsersAndGroups = async (query) => {
    const { apiStore } = this.props
    const res = await apiStore.searchUsersAndGroups(query)
    this.updateSuggestions(res.data)
  }

  @action updateSuggestions = (data) => {
    this.suggestions = data.map(d => (
      {
        // this gets used as the key so needs to be unique for users/groups
        id: `${d.id}-${d.internalType}`,
        name: d.name,
        handle: d.handle,
        // depends if user or group
        avatar: d.pic_url_square || d.filestack_file_url
      }
    ))
  }

  focus = () => {
    this.editor.focus()
  }

  render() {
    const {
      onChange,
      onOpenSuggestions,
      handleReturn,
      editorState
    } = this.props
    const { MentionSuggestions } = this.mentionPlugin
    const plugins = [this.mentionPlugin]

    return (
      <StyledCommentInput onClick={this.focus}>
        <Editor
          editorState={editorState}
          onChange={onChange}
          handleReturn={handleReturn}
          plugins={plugins}
          ref={(element) => {
            this.editor = element
            this.props.setEditor(element)
          }}
        />
        <MentionSuggestions
          onSearchChange={this.onSearchChange}
          onOpen={onOpenSuggestions}
          onClose={this.handleClose}
          suggestions={this.suggestions.toJS()}
          entryComponent={CustomMentionSuggestion}
        />
      </StyledCommentInput>
    )
  }
}

CommentInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  onOpenSuggestions: PropTypes.func.isRequired,
  onCloseSuggestions: PropTypes.func.isRequired,
  handleReturn: PropTypes.func.isRequired,
  setEditor: PropTypes.func.isRequired,
  editorState: PropTypes.object.isRequired,
}
CommentInput.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CommentInput
