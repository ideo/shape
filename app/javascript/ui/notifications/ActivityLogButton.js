import { observer } from 'mobx-react'

import CommentIcon from '~/ui/icons/CommentIcon'
import { apiStore, uiStore } from '~/stores'
import { CircledIcon } from '~/ui/global/styled/buttons'

@observer
class ActivityLogButton extends React.Component {
  get activityCount() {
    return apiStore.unreadActivityCount
  }

  toggleActivityLog() {
    const val = !uiStore.activityLogOpen
    uiStore.update('activityLogOpen', val)
  }

  handleComments = (ev) => {
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
        <span className="count">{this.activityCount}</span>
        <CommentIcon />
      </CircledIcon>
    )
  }
}

export default ActivityLogButton
