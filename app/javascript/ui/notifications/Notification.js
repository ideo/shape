import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import pluralize from 'pluralize'
import { apiStore } from '~/stores'
import { Flex } from 'reflexbox'
import styled from 'styled-components'

import Activity from '~/ui/notifications/Activity'
import { CloseButton } from '~/ui/global/styled/buttons'
import InlineLoader from '~/ui/layout/InlineLoader'
import Moment from '~/ui/global/Moment'
import { NotificationButton } from '~/ui/global/styled/buttons'
import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'

function pluralTypeName(name) {
  return pluralize(name).toLowerCase()
}

const StyledContainer = styled.div`
  background: ${props => (props.isDefault ? v.colors.activityDarkestBlue : v.colors.orange)};
  box-sizing: border-box;
  margin-left: 10px;
  margin-right: 10px;
  margin-top: 4px;
  min-height: ${props => (props.isDefault ? 75 : 60)}px;
  padding: ${props => (props.isDefault ? '12px' : '8px 32px')};
  position: relative;

  ${props => !props.isDefault && (`
    max-height: 23444px;
    a {
      color: white;
    }

    p {
      font-size: 14px;
    }
  `)}
`
StyledContainer.displayName = 'StyledNotification'

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-left: 10px;
  margin-right: 9px;
  margin-top: 20px;
  width: 12px;
  ${props => !props.isDefault && (`
    justify-content: flex-end;
    margin-top: 0;
    position: absolute;
    right: -5px;
    top: 2px;
  `)}
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
        console.warn(err)
        // Create a fake target in this strange usecase to remove loading
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

  handleRead = (ev) => {
    ev.preventDefault()
    this.updateRead()
  }

  get isDefaultStyle() {
    return this.props.style === 'default'
  }

  get styledTextColor() {
    if (this.props.style === 'alert') return v.colors.white
  }

  get renderButton() {
    return (
      <ButtonContainer isDefault={this.isDefaultStyle}>
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title="Dismiss"
          placement="bottom"
        >
          { this.isDefaultStyle
            ? <NotificationButton className="read" onClick={this.handleRead} />
            : <CloseButton className="read" onClick={this.handleRead} color={v.colors.white} />
          }
        </Tooltip>
      </ButtonContainer>
    )
  }

  render() {
    const { notification } = this.props
    let content
    if (!notification.activity.target) {
      content = <InlineLoader />
    } else {
      content = (
        <Flex>
          {this.isDefaultStyle && this.renderButton}
          <div>
            {this.isDefaultStyle && (
              <Moment date={notification.created_at} color={this.styledTextColor} />
            )}
            <Activity
              action={notification.activity.action}
              actors={notification.combined_actors}
              target={notification.activity.target}
              subjectUsers={notification.activity.subject_users}
              subjectGroups={notification.activity.subject_groups}
              actorCount={notification.combined_actor_count}
              content={notification.activity.content}
              handleRead={this.handleRead}
            />
          </div>
          {!this.isDefaultStyle && this.renderButton}
        </Flex>
      )
    }
    return (
      <StyledContainer isDefault={this.isDefaultStyle}>
        {content}
      </StyledContainer>
    )
  }
}

Notification.propTypes = {
  notification: MobxPropTypes.objectOrObservableObject.isRequired,
  style: PropTypes.oneOf(['default', 'alert']),
}
Notification.defaultProps = {
  style: 'default'
}

export default Notification
