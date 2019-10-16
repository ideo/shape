import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import CheckIcon from '~/ui/icons/CheckIcon'
import ReopenIcon from '~/ui/icons/ReopenIcon'
import CommentThumbnail from '~/ui/threads/CommentThumbnail'
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
  cursor: pointer;
`
ResolveIconHolder.displayName = 'ResolveIconHolder'

const StyledCommentSubject = styled.div`
  display: flex;
  font-family: ${v.fonts.sans};
  font-style: italic;
  color: ${v.colors.commonMedium};
`

class CommentSubject extends React.Component {
  get textContent() {
    const { threadRecord, textContent } = this.props
    if (!textContent) {
      return threadRecord.name
    }

    // also truncate textContent to a reasonable limit?
    return `${textContent}...`
  }

  handleResolve = e => {
    e.preventDefault()
    // TODO: should toggle comment state from open||reopened->closed, closed->reopened
  }

  renderResolveButton = () => {
    const { status } = this.props
    if (!status) return null

    return (
      <ResolveIconHolder onClick={this.handleResolve}>
        {status !== 'closed' ? <CheckIcon /> : <ReopenIcon />}
      </ResolveIconHolder>
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
        />
        {this.textContent}
        {this.renderResolveButton()}
      </StyledCommentSubject>
    )
  }
}

CommentSubject.propTypes = {
  subjectRecord: MobxPropTypes.objectOrObservableObject.isRequired,
  threadRecord: MobxPropTypes.objectOrObservableObject.isRequired,
  textContent: PropTypes.string,
  status: PropTypes.string,
}

CommentSubject.defaultProps = {
  textContent: null,
  status: null,
}

export default CommentSubject
