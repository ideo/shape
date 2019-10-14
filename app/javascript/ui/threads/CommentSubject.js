import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import CommentThumbnail from '~/ui/threads/CommentThumbnail'
import v from '~/utils/variables'

const StyledCommentSubject = styled.div`
  display: flex;
  font-family: ${v.fonts.sans};
  font-style: italic;
  color: ${v.colors.commonMedium};
`

class CommentSubject extends React.Component {
  get textContent() {
    const { record, textContent } = this.props
    if (!textContent) {
      return record.name
    }

    // also truncate textContent to a reasonable limit?
    return `${textContent}...`
  }

  render() {
    const { record } = this.props
    return (
      <StyledCommentSubject>
        <CommentThumbnail record={record} iconTop={1} />
        {this.textContent}
      </StyledCommentSubject>
    )
  }
}

CommentSubject.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  textContent: PropTypes.string,
}

CommentSubject.defaultProps = {
  record: null,
  textContent: null,
}

export default CommentSubject
