import { PropTypes as MobxPropTypes } from 'mobx-react'
import pluralize from 'pluralize'
import { apiStore } from '~/stores'
import { Flex } from 'reflexbox'
import styled from 'styled-components'

import Activity from '~/ui/notifications/Activity'
import InlineLoader from '~/ui/layout/InlineLoader'
import Moment from '~/ui/global/Moment'
import { NotificationButton } from '~/ui/global/styled/buttons'
import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'

function pluralTypeName(name) {
  return pluralize(name).toLowerCase()
}

const StyledContainer = styled.div`
  background: ${v.colors.activityDarkestBlue};
  box-sizing: border-box;
  margin-left: 10px;
  margin-right: 10px;
  margin-top: 4px;
  min-height: 75px;
  padding: 12px;
  position: relative;
`
StyledContainer.displayName = 'StyledNotification'

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-left: 10px;
  margin-right: 9px;
  margin-top: 20px;
  width: 12px;
`

class Notification extends React.PureComponent {
  componentWillMount() {
    const { notification } = this.props
    const { activity } = notification
    const targetType = pluralTypeName(activity.target_type)
    const target = apiStore.find(targetType, activity.target_id)
    if (!target) {
      apiStore.fetch(targetType, activity.target_id).then(res => {
        activity.assignRef('target', res.data)
      }).catch((err) => {
        console.warn(err)
        // Create a fake target in this strange usecase
        activity.assignRef('target', { name: 'Unknown', internalType: targetType })
      })
    } else {
      activity.assignRef('target', target)
    }
  }

  updateRead() {
    const { notification } = this.props
    notification.read = true
    notification.save()
  }

  combineActors() {
    const { notification } = this.props
    if (!notification.combined_activities_ids.length) {
      return [notification.activity.actor]
    }
    return notification.combined_activities.map(activity =>
      activity.actor)
  }

  handleRead = (ev) => {
    ev.preventDefault()
    this.updateRead()
  }

  render() {
    const { notification } = this.props
    const { activity } = notification
    let content
    if (!activity.target) {
      content = <InlineLoader />
    } else {
      content = (
        <Flex>
          <ButtonContainer>
            <Tooltip
              classes={{ tooltip: 'Tooltip' }}
              title="Dismiss"
              placement="bottom"
            >
              <NotificationButton className="read" onClick={this.handleRead} />
            </Tooltip>
          </ButtonContainer>
          <div>
            <Moment date={notification.created_at} />
            <Activity
              action={activity.action}
              actors={this.combineActors()}
              target={activity.target}
              subjectUsers={activity.subject_users}
              subjectGroups={activity.subject_groups}
              actorCount={notification.combined_activities_ids.length}
              content={activity.content}
            />
          </div>
        </Flex>
      )
    }
    return (
      <StyledContainer>
        {content}
      </StyledContainer>
    )
  }
}

Notification.propTypes = {
  notification: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default Notification
