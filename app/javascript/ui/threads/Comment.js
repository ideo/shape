import _ from 'lodash'
import { toJS } from 'mobx'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { EditorState, convertFromRaw } from 'draft-js'
import Editor from 'draft-js-plugins-editor'
import createMentionPlugin from 'draft-js-mention-plugin'
import createLinkifyPlugin from 'draft-js-linkify-plugin'
import styled from 'styled-components'

import v from '~/utils/variables'
import { DisplayText } from '~/ui/global/styled/typography'
import { InlineRow } from '~/ui/global/styled/layout'
import Moment from '~/ui/global/Moment'
import Avatar from '~/ui/global/Avatar'
import { StyledCommentInput } from './CustomCommentMentions'
import { apiStore } from '~/stores'
import TrashIcon from '~/ui/icons/TrashIcon'
import { showOnHoverCss, hideOnHoverCss } from '~/ui/grid/shared'

const StyledComment = StyledCommentInput.extend`
  ${showOnHoverCss};
  ${hideOnHoverCss};
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

export const StyledCommentActions = styled.div`
  align-items: center;
  cursor: pointer;
  display: flex;
  height: 34px;
  top: 0.25rem;

  svg {
    color: ${v.colors.commonDark};
    &:hover {
      color: ${v.colors.commonLight};
    }
  }
`

const FlexPushRight = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  position: relative;
`

const DeleteButton = styled.button`
  width: 42px;
`

const Timestamp = styled.span`
  position: absolute;
  right: 0;
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

  handleDeleteClick = () => {
    const { comment } = this.props
    comment.API_destroy()
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
          <FlexPushRight>
            <Timestamp className="timestamp hide-on-hover">
              <Moment date={comment.updated_at} />
            </Timestamp>
            <StyledCommentActions className="show-on-hover">
              {comment.persisted &&
                apiStore.currentUserId === comment.author.id && (
                  <DeleteButton
                    onClick={this.handleDeleteClick}
                    className="test-delete-comment"
                  >
                    <TrashIcon />
                  </DeleteButton>
                )}
            </StyledCommentActions>
          </FlexPushRight>
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
