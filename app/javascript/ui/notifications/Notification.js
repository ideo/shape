import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import pluralize from 'pluralize'
import { apiStore } from '~/stores'
import { Flex } from 'reflexbox'
import styled from 'styled-components'

import trackError from '~/utils/trackError'
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

@observer
class Notification extends React.Component {
  componentWillMount() {
    const { notification } = this.props
    const { activity } = notification
    const targetType = pluralTypeName(activity.target_type)
    const target = apiStore.find(targetType, activity.target_id)
    if (!target) {
      apiStore.fetch(targetType, activity.target_id).then(res => {
        activity.assignRef('target', res.data)
      }).catch((err) => {
        // Create a fake target in this strange usecase to remove loading
        activity.assignRef('target', { name: 'Unknown', internalType: targetType })
        trackError(err, { name: 'Notification:Mount' })
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

  handleRead = (ev) => {
    ev.preventDefault()
    this.updateRead()
  }

  get actors() {
    const { notification } = this.props
    return notification.combined_actors.length
      ? notification.combined_actors
      : [notification.activity.actor]
  }

  render() {
    const { notification } = this.props
    let content
    if (!notification.activity.target) {
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
              action={notification.activity.action}
              actors={this.actors}
              target={notification.activity.target}
              subjectUsers={notification.activity.subject_users}
              subjectGroups={notification.activity.subject_groups}
              actorCount={notification.combined_actor_count}
              content={notification.activity.content}
              handleRead={this.handleRead}
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
