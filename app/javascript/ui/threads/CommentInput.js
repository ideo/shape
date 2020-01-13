import _ from 'lodash'
import PropTypes from 'prop-types'
import { observable, action } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Editor from 'draft-js-plugins-editor'
import createMentionPlugin from 'draft-js-mention-plugin'
import createLinkifyPlugin from 'draft-js-linkify-plugin'

import { uiStore } from '~/stores'
import {
  StyledCommentInput,
  CustomMentionSuggestion,
} from '~/ui/threads/CustomCommentMentions'

@inject('apiStore', 'uiStore')
@observer
class CommentInput extends React.Component {
  @observable
  suggestions = []

  constructor(props) {
    super(props)
    this.initMentionPlugin()
    this.initLinkifyPlugin()
    this.searchUsersAndGroups = _.debounce(this._searchUsersAndGroups, 300)
  }

  componentWillUnmount() {
    this.props.setEditor(null, { unset: true })
  }

  positionSuggestions = ({ decoratorRect, state, props }) => {
    const { suggestions } = props
    const { isActive } = state
    const cols = _.get(uiStore, 'gridSettings.cols')
    let transform
    let transition
    let top = '-36px'

    if (isActive && suggestions.length > 0) {
      transform = `scaleY(1)`
      transition = 'all 0.25s cubic-bezier(.3,1.2,.2,1)'
      const { y } = uiStore.activityLogPosition
      const maxCommentSuggestionsHeight = decoratorRect.top - y + 16 // max height is the height above the input and the activity box
      const totalSuggestionsLength = 45 * suggestions.length

      // TODO: We should reverse sort the list if we are placing list items on the top of the comment input
      const shouldPlaceSuggestionsAtBottom =
        decoratorRect.top + totalSuggestionsLength < window.innerHeight
      top = `${
        shouldPlaceSuggestionsAtBottom
          ? maxCommentSuggestionsHeight + 6
          : maxCommentSuggestionsHeight - (totalSuggestionsLength + 56)
      }px`
      if (uiStore.isTouchDevice) {
        if (cols == 1) {
          // use activity log height since decoratorRect and activity log y position are static for mobile
          top = `${uiStore.activityLogPosition.h - 24}px`
        } else {
          // TODO:
          // 1. Handle comment window clipping comment mentions
          // 2. Handle touch device virtual keyboard pushing focused windows when placed in virtual keyboard area
          const shouldPlaceSuggestionsAtBottomForTouchDevice =
            decoratorRect.top + totalSuggestionsLength < window.innerHeight / 2
          top = `${
            shouldPlaceSuggestionsAtBottomForTouchDevice
              ? maxCommentSuggestionsHeight + 6
              : maxCommentSuggestionsHeight - (totalSuggestionsLength + 75)
          }px`
        }
      }
    } else if (isActive) {
      transform = 'scaleY(0)'
      transition = 'all 0.25s cubic-bezier(.3,1,.2,1)'
    }

    return {
      transform,
      transition,
      top,
    }
  }

  initMentionPlugin() {
    this.mentionPlugin = createMentionPlugin({
      positionSuggestions: this.positionSuggestions,
      // treat the entire "@xyz" as an all-or-nothing token
      entityMutability: 'IMMUTABLE',
    })
  }

  initLinkifyPlugin() {
    this.linkifyPlugin = createLinkifyPlugin({ target: '_blank' })
  }

  @action
  handleOpenSuggestions = () => {
    this.suggestionsOpen = true
  }

  @action
  handleCloseSuggestions = () => {
    this.suggestionsOpen = false
  }

  handleReturn = e => {
    if (!e.shiftKey && !this.suggestionsOpen) {
      // submit message
      this.props.handleSubmit(e)
      return 'handled'
    }
    return 'not-handled'
  }

  @action
  handleClose = () => {
    this.handleCloseSuggestions()
    this.suggestions = []
  }

  onSearchChange = ({ value }) => {
    this.searchUsersAndGroups(value)
  }

  _searchUsersAndGroups = async query => {
    const { apiStore } = this.props
    const res = await apiStore.searchUsersAndGroups(query)
    this.updateSuggestions(res.data)
  }

  @action
  updateSuggestions = data => {
    this.suggestions = data.map(d => ({
      // this gets used as the key so needs to be unique for users/groups
      id: `${d.id}__${d.internalType}`,
      // "name" is how it renders the mention so we insert the handle here
      name: `@${d.handle}`,
      full_name: d.name,
      // depends if user or group
      avatar: d.pic_url_square || d.filestack_file_url,
    }))
  }

  focus = () => {
    this.editor.focus()
  }

  render() {
    const { onChange, editorState } = this.props
    const { MentionSuggestions } = this.mentionPlugin
    MentionSuggestions.displayName = 'MentionSuggestions'
    const plugins = [this.mentionPlugin, this.linkifyPlugin]

    return (
      <StyledCommentInput editing onClick={this.focus}>
        <Editor
          editorState={editorState}
          onChange={onChange}
          handleReturn={this.handleReturn}
          plugins={plugins}
          placeholder="Add comment"
          ref={element => {
            this.editor = element
            this.props.setEditor(element)
          }}
        />
        <MentionSuggestions
          onSearchChange={this.onSearchChange}
          onOpen={this.handleOpenSuggestions}
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
  handleSubmit: PropTypes.func.isRequired,
  setEditor: PropTypes.func.isRequired,
  editorState: MobxPropTypes.objectOrObservableObject.isRequired,
}
CommentInput.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

CommentInput.displayName = 'CommentInput'

export default CommentInput
