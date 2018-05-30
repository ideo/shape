import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'
import { DisplayText } from '~/ui/global/styled/typography'
import { InlineRow } from '~/ui/global/styled/layout'
import Moment from '~/ui/global/Moment'
import UserAvatar from '~/ui/users/UserAvatar'

const StyledComment = styled.div`
  padding: 10px;
  margin-bottom: 5px;
  background: ${props => (props.unread ? v.colors.activityLightBlue : v.colors.activityMedBlue)};

  transition: background 1s 0.5s ease;

  &:last-child {
    margin-bottom: 0;
  }

  .message {
    margin-top: 5px;
  }
`

class Comment extends React.Component {
  render() {
    const { comment } = this.props
    return (
      <StyledComment unread={comment.unread}>
        <InlineRow align="center">
          <UserAvatar
            user={comment.author}
            size={32}
            className="author-img"
          />
          <DisplayText className="author">
            { comment.author.name }
          </DisplayText>
          <span className="timestamp">
            <Moment date={comment.updated_at} />
          </span>
        </InlineRow>
        <p className="message">
          { comment.message }
        </p>
      </StyledComment>
    )
  }
}

Comment.propTypes = {
  comment: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default Comment
