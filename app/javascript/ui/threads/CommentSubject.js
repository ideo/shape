import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import CheckIcon from '~/ui/icons/CheckIcon'
import ReopenIcon from '~/ui/icons/ReopenIcon'
import CommentThumbnail from '~/ui/threads/CommentThumbnail'
import v from '~/utils/variables'
import Tooltip from '~/ui/global/Tooltip'

const ResolveIconHolder = styled.div`
  color: ${v.colors.commonLight};
  background: ${v.colors.secondaryDarkest};
  position: relative;
  border-radius: 8px;
  width: 16px;
  height: 16px;
  cursor: pointer;
`
ResolveIconHolder.displayName = 'ResolveIconHolder'

const StyledCommentSubject = styled.div`
  display: flex;
  font-family: ${v.fonts.sans};
  color: ${v.colors.commonMedium};
  padding-top: 10px;
  overflow-x: hidden;
`

const CommentTextContent = styled.div`
  flex: 1;
  font-style: italic;
  word-wrap: break-word;
`
StyledCommentSubject.displayName = 'StyledCommentSubject'

class CommentSubject extends React.Component {
  get textContent() {
    const { threadRecord, textContent } = this.props
    if (!textContent) {
      return threadRecord.name
    }

    // also truncate textContent to a reasonable limit?
    return `${textContent}...`
  }

  renderResolveButton = () => {
    const { status, handleResolveButtonClick } = this.props
    const isResolved = status === 'resolved'
    return (
      <Tooltip title={!isResolved ? 'resolve' : 're-open'} placement="top">
        <ResolveIconHolder
          onClick={handleResolveButtonClick}
          className="resolve-comment"
        >
          {!isResolved ? <CheckIcon /> : <ReopenIcon />}
        </ResolveIconHolder>
      </Tooltip>
    )
  }

  render() {
    const { subjectRecord, threadRecord } = this.props
    return (
      <StyledCommentSubject>
        <CommentThumbnail
          subjectRecord={subjectRecord}
          threadRecord={threadRecord}
          iconTop={1}
          useSubjectIcon={true}
        />
        <CommentTextContent>{this.textContent}</CommentTextContent>
        {status && this.renderResolveButton()}
      </StyledCommentSubject>
    )
  }
}

CommentSubject.propTypes = {
  subjectRecord: MobxPropTypes.objectOrObservableObject.isRequired,
  threadRecord: MobxPropTypes.objectOrObservableObject.isRequired,
  textContent: PropTypes.string,
  status: PropTypes.string,
  handleResolveButtonClick: PropTypes.func,
}

CommentSubject.defaultProps = {
  textContent: null,
  status: null,
  handleResolveButtonClick: null,
}

export default CommentSubject
