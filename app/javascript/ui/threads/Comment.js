import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Flex } from 'reflexbox'

import v from '~/utils/variables'
import Moment from '~/ui/global/Moment'
import UserAvatar from '~/ui/users/UserAvatar'

const StyledComment = styled.div`
  padding: 10px;
  margin-bottom: 5px;
  background: ${v.colors.activityLightBlue};
  .author, .timestamp {
    font-family: ${v.fonts.sans};
    display: inline-block;
    margin-left: 10px;
  }
  .timestamp {
    font-size: 0.9rem;
    color: ${v.colors.cloudy};
  }
  .message {
    margin-top: 5px;
  }
`

class Comment extends React.Component {
  render() {
    const { comment } = this.props

    return (
      <StyledComment>
        <Flex align="center">
          <UserAvatar
            user={comment.author}
            size={32}
            className="author-img"
          />
          <span className="author">
            { comment.author.name }
          </span>
          <span className="timestamp">
            <Moment date={comment.created_at} />
          </span>
        </Flex>
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
