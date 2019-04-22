import _ from 'lodash'
import { toJS } from 'mobx'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { EditorState, convertFromRaw } from 'draft-js'
import Editor from 'draft-js-plugins-editor'
import createMentionPlugin from 'draft-js-mention-plugin'
import createLinkifyPlugin from 'draft-js-linkify-plugin'

import v from '~/utils/variables'
import { DisplayText } from '~/ui/global/styled/typography'
import { InlineRow } from '~/ui/global/styled/layout'
import Moment from '~/ui/global/Moment'
import Avatar from '~/ui/global/Avatar'
import { StyledCommentInput } from './CustomCommentMentions'

const StyledComment = StyledCommentInput.extend`
  padding: 10px;
  margin-bottom: 5px;
  background: ${props =>
    props.unread ? v.colors.secondaryLight : v.colors.secondaryMedium};

  transition: background 1s 0.5s ease;

  &:last-child {
    margin-bottom: 0;
  }

  .message {
    font-family: ${v.fonts.sans};
    margin-top: 5px;
    a,
    a:hover,
    a:active,
    a:visited {
      color: ${v.colors.ctaPrimary};
    }
  }
`

class Comment extends React.Component {
  constructor(props) {
    super(props)
    this.mentionPlugin = createMentionPlugin()
    this.linkifyPlugin = createLinkifyPlugin({ target: '_blank' })
    this.state = {
      editorState: EditorState.createEmpty(),
    }
  }

  componentWillMount() {
    const { comment } = this.props
    const draftjsData = toJS(comment.draftjs_data)
    if (!_.isEmpty(draftjsData)) {
      const contentState = convertFromRaw(draftjsData)
      const editorState = EditorState.createWithContent(contentState)
      this.setState({ editorState })
    }
  }

  renderMessage() {
    const { comment } = this.props
    if (_.isEmpty(toJS(comment.draftjs_data))) {
      // fallback only necessary for supporting older comments before we added draftjs
      // otherwise this use case will go away
      return comment.message
    }
    const plugins = [this.mentionPlugin, this.linkifyPlugin]
    return (
      <Editor
        readOnly
        editorState={this.state.editorState}
        // NOTE: this onChange is necessary for draft-js-plugins to decorate properly!
        // see https://github.com/draft-js-plugins/draft-js-plugins/issues/530#issuecomment-258736772
        onChange={editorState => this.setState({ editorState })}
        plugins={plugins}
      />
    )
  }

  render() {
    const { comment } = this.props
    const { author } = comment

    return (
      <StyledComment unread={comment.unread}>
        <InlineRow align="center">
          <Avatar
            title={author.name}
            url={author.pic_url_square}
            linkToCollectionId={author.user_profile_collection_id}
            className="author-img"
          />
          <DisplayText className="author" color={v.colors.white}>
            {comment.author.name}
          </DisplayText>
          <span className="timestamp">
            <Moment date={comment.updated_at} />
          </span>
        </InlineRow>
        <div className="message">{this.renderMessage()}</div>
      </StyledComment>
    )
  }
}

Comment.propTypes = {
  comment: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default Comment
