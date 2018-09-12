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

  componentWillUnmount() {
    this.props.setEditor(null, { unset: true })
  }

  initMentionPlugin() {
    this.mentionPlugin = createMentionPlugin({
      positionSuggestions,
      // treat the entire "@xyz" as an all-or-nothing token
      entityMutability: 'IMMUTABLE',
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
        id: `${d.id}__${d.internalType}`,
        // "name" is how it renders the mention so we insert the handle here
        name: `@${d.handle}`,
        full_name: d.name,
        // depends if user or group
        avatar: d.pic_url_square || d.filestack_file_url,
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
      editorState,
    } = this.props
    const { MentionSuggestions } = this.mentionPlugin
    MentionSuggestions.displayName = 'MentionSuggestions'
    const plugins = [this.mentionPlugin]

    return (
      <StyledCommentInput editing onClick={this.focus}>
        <Editor
          editorState={editorState}
          onChange={onChange}
          handleReturn={handleReturn}
          plugins={plugins}
          placeholder="Add comment"
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
  editorState: MobxPropTypes.objectOrObservableObject.isRequired,
}
CommentInput.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

CommentInput.displayName = 'CommentInput'

export default CommentInput
