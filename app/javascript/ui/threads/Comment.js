import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'
import Moment from '~/ui/global/Moment'

const StyledComment = styled.div`
  padding: 10px;
  margin-left: 20px;
  border-bottom: 1px solid gray;
  .author {
    font-family: ${v.fonts.sans};
  }
`

class Comment extends React.Component {
  render() {
    const { comment } = this.props

    return (
      <StyledComment>
        <p className="author">
          { comment.author.name }
          &nbsp;|&nbsp;
          <Moment date={comment.created_at} format="lll" />
        </p>
        <p>
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
