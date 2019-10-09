import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'

import CommentThumbnail from '~/ui/threads/CommentThumbnail'

class CommentSubject extends React.Component {
  render() {
    const { record, textContent } = this.props
    return (
      <Flex>
        {/* how to get titlelines/ CommentThreadHeader#countLines from here? */}
        <CommentThumbnail record={record} iconTop={1} />
        {textContent}
      </Flex>
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
