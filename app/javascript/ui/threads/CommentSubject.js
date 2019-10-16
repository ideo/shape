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
    const { record, textContent } = this.props
    if (!textContent) {
      return record.name
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
    const { record, status } = this.props
    return (
      <StyledCommentSubject>
        <CommentThumbnail record={record} iconTop={1} />
        {this.textContent}
        {status && this.renderResolveButton()}
      </StyledCommentSubject>
    )
  }
}

CommentSubject.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  textContent: PropTypes.string,
  status: PropTypes.string,
  handleResolveButtonClick: PropTypes.func,
}

CommentSubject.defaultProps = {
  record: null,
  textContent: null,
  status: null,
  handleResolveButtonClick: null,
}

export default CommentSubject
