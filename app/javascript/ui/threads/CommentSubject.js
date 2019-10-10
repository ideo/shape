import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'
import styled from 'styled-components'
import CheckIcon from '~/ui/icons/CheckIcon'
import ReopenIcon from '~/ui/icons/ReopenIcon'
import v from '~/utils/variables'
const ResolveIconHolder = styled.div`
  color: ${v.colors.commonLight};
  background: ${v.colors.secondaryDarkest};
  position: relative;
  float: right;
  border-radius: 8px;
  width: 16px;
  height: 16px;
  top: 3px;
  left: 9px;
`
ResolveIconHolder.displayName = 'ResolveIconHolder'

import CommentThumbnail from '~/ui/threads/CommentThumbnail'

class CommentSubject extends React.Component {
  render() {
    const { record, textContent } = this.props
    const status = 'closed' // FIXME: remove once record.comment is a thing
    return (
      <Flex>
        {/* how to get titlelines/ CommentThreadHeader#countLines from here? */}
        <CommentThumbnail record={record} iconTop={1} />
        {textContent}
        /*FIXME: will render a huge icon, fix styling*/
        {status === 'closed' ? <ReopenIcon /> : <CheckIcon />}
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
