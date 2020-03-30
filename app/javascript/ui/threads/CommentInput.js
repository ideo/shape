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

  /** NOTE: This menthod is due for refactoring/documenting.
   * It is responsible for handling comment input position based on:
   * - comment count
   * - activity log box height
   * - activity log box y position
   * - device type: android, ios, web
   * - for IOS/Android, device orientation: portrait, landscape
   * - for IOS, will be pushed by virtual keyboard
   */
  positionSuggestions = ({ decoratorRect, state, props }) => {
    const { suggestions } = props
    const { isActive } = state

    if (isActive && _.isEmpty(suggestions)) {
      return
    }

    const {
      y: activityLogPosition,
      h: activityLogHeight,
    } = uiStore.activityLogPosition
    const maxCommentSuggestionsHeight =
      decoratorRect.top - activityLogPosition + 16 // height above the input and the activity box
    const maxPossibleSuggestions = uiStore.isTouchDevice ? 3 : 6 // show a max of 3.5 suggestions for phones/tablets and 6.5 suggestions for desktop
    const clampedSuggestionsLength = _.clamp(
      suggestions.length,
      0,
      maxPossibleSuggestions
    )
    const totalSuggestionsLength = 45 * clampedSuggestionsLength

    if (!uiStore.isTouchDevice) {
      const shouldPlaceSuggestionsAtBottom =
        decoratorRect.top + totalSuggestionsLength < window.innerHeight
      const newTop = maxCommentSuggestionsHeight - totalSuggestionsLength - 98

      return {
        top: `${
          shouldPlaceSuggestionsAtBottom
            ? maxCommentSuggestionsHeight + 6
            : clampedSuggestionsLength === maxPossibleSuggestions
            ? newTop - 6
            : newTop + 40
        }px`,
      }
    } else {
      let top = '0px'
      const cols = _.get(uiStore, 'gridSettings.cols')

      if (cols == 1 && uiStore.isIOS) {
        // will place at the top of the comment input, use activity log height since iOS phone comment box is full-screen
        const _maxCommentSuggestionsHeight =
          activityLogPosition - activityLogHeight
        const newTop =
          _maxCommentSuggestionsHeight - totalSuggestionsLength + 50
        top = `${
          clampedSuggestionsLength === maxPossibleSuggestions
            ? newTop
            : newTop + 38
        }px`
      } else if (
        (cols == 1 && uiStore.isAndroid) ||
        (uiStore.isIOS && !uiStore.isPortrait)
      ) {
        // will place at the top of the comment input for android phones and iPad landscape
        const newTop = maxCommentSuggestionsHeight - totalSuggestionsLength
        top = `${
          clampedSuggestionsLength === maxPossibleSuggestions
            ? newTop + 90
            : newTop + 136
        }px`
      } else {
        let newTop = maxCommentSuggestionsHeight - totalSuggestionsLength - 60
        if (uiStore.isIOS && uiStore.isPortrait) {
          // For iPad portrait, check if activity log is already placed where virtual keyboard will be
          const activityLogPositionAndHeight =
            activityLogPosition + activityLogHeight
          const willBePushedByVirtualKeyboard =
            activityLogPositionAndHeight > window.innerHeight / 2 - 25
          if (willBePushedByVirtualKeyboard) {
            newTop = newTop + 400
          }
          top = `${
            clampedSuggestionsLength === maxPossibleSuggestions
              ? newTop - 30
              : newTop
          }px`
        }
      }

      return {
        top,
      }
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
    const params = {
      query: value,
      per_page: 20,
    }
    this.searchUsersAndGroups(params)
  }

  _searchUsersAndGroups = async params => {
    const { apiStore } = this.props
    const res = await apiStore.searchUsersAndGroups(params)
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
    const mentionsSize = uiStore.isTouchDevice ? 'small' : 'default'

    return (
      <StyledCommentInput
        editing
        onClick={this.focus}
        mentionsSize={mentionsSize}
      >
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
