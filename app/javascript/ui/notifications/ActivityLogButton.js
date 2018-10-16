import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import styled from 'styled-components'

import CommentIcon from '~/ui/icons/CommentIcon'
import { apiStore, uiStore } from '~/stores'
import { CircledIcon } from '~/ui/global/styled/buttons'
import v from '~/utils/variables'

export const ActivityCount = styled.span`
  width: ${props => (props.size === 'sm' ? 12 : 18)}px;
  top: 0;
  position: absolute;
  height: ${props => (props.size === 'sm' ? 12 : 18)}px;
  line-height: 1;
  left: -5px;
  justify-content: center;
  font-family: ${v.fonts.sans};
  font-size: ${props => (props.size === 'sm' ? '0.625rem' : '0.7rem')};
  color: white;
  display: flex;
  border-radius: 50%;
  background-color: ${v.colors.alert};
  align-items: center;
`
ActivityCount.displayName = 'ActivityCount'
ActivityCount.propTypes = {
  size: PropTypes.oneOf(['sm', 'md']),
}
ActivityCount.defaultProps = {
  size: 'md',
}

@observer
class ActivityLogButton extends React.Component {
  // eslint-disable-next-line class-methods-use-this
  get activityCount() {
    return apiStore.unreadActivityCount
  }

  toggleActivityLog = () => {
    const val = !uiStore.activityLogOpen
    uiStore.update('activityLogOpen', val)
  }

  handleComments = ev => {
    ev.preventDefault()
    this.toggleActivityLog()
  }

  render() {
    return (
      <CircledIcon
        key="comments"
        active={uiStore.activityLogOpen}
        onClick={this.handleComments}
      >
        <CommentIcon />
        {this.activityCount > 0 && (
          <ActivityCount className="count">{this.activityCount}</ActivityCount>
        )}
      </CircledIcon>
    )
  }
}

export default ActivityLogButton
