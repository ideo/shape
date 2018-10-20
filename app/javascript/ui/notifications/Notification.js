import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, action, runInAction } from 'mobx'
import pluralize from 'pluralize'
import { apiStore } from '~/stores'
import { Flex } from 'reflexbox'
import sleep from '~/utils/sleep'
import styled from 'styled-components'

import trackError from '~/utils/trackError'
import Activity from '~/ui/notifications/Activity'
import InlineLoader from '~/ui/layout/InlineLoader'
import Moment from '~/ui/global/Moment'
import { CloseButton, NotificationButton } from '~/ui/global/styled/buttons'
import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'

function pluralTypeName(name) {
  return pluralize(name).toLowerCase()
}

const StyledContainer = styled.div`
  background: ${props =>
    props.isDefault ? v.colors.secondaryDarkest : v.colors.alert};
  box-sizing: border-box;
  margin-left: ${props => (props.isDefault ? 10 : 0)}px;
  margin-right: ${props => (props.isDefault ? 10 : 0)}px;
  margin-top: 4px;
  min-height: ${props => (props.isDefault ? 75 : 62)}px;
  padding: ${props => (props.isDefault ? '12px' : '8px 32px')};
  position: relative;
  transition: ${v.transitionWithDelay};
  width: calc(100% - ${props => (props.isDefault ? '20px' : '0px')});

  &.show-read {
    opacity: 0;
  }

  ${props =>
    !props.isDefault &&
    `
    a {
      color: white;
    }

    p {
      font-size: 14px;
    }
  `};
`
StyledContainer.displayName = 'StyledNotification'

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-left: 10px;
  margin-right: 9px;
  margin-top: 20px;
  width: 12px;
  ${props =>
    !props.isDefault &&
    `
    justify-content: flex-end;
    margin-top: 0;
    position: absolute;
    right: -5px;
    top: 2px;
  `};
`

@observer
class Notification extends React.Component {
  @observable
  fadeInProgress = true
  componentWillMount() {
    const { notification } = this.props
    const { activity } = notification
    const targetType = pluralTypeName(activity.target_type)
    const target = apiStore.find(targetType, activity.target_id)
    if (!target) {
      apiStore
        .fetch(targetType, activity.target_id)
        .then(res => {
          activity.setTarget(res.data)
        })
        .catch(err => {
          // Create a fake target in this strange usecase to remove loading
          activity.setTarget({ name: 'Unknown', internalType: targetType })
          trackError(err, { name: 'Notification:Mount' })
        })
    } else {
      activity.setTarget(target)
    }
  }

  @action
  componentDidMount() {
    this.fadeInProgress = false
  }

  updateRead() {
    const { notification } = this.props
    runInAction(() => {
      this.fadeInProgress = true
    })
    sleep(500).then(() => {
      notification.read = true
      notification.save()
      sleep(500).then(
        runInAction(() => {
          this.fadeInProgress = false
        })
      )
    })
  }

  handleRead = ev => {
    ev.preventDefault()
    this.updateRead()
  }

  get isDefaultStyle() {
    return this.props.styleType === 'default'
  }

  get styledTextColor() {
    if (this.props.styleType === 'alert') return v.colors.white
    return null
  }

  get shouldHide() {
    return this.fadeInProgress
  }

  get actors() {
    const { notification } = this.props
    return notification.combined_actors.length
      ? notification.combined_actors
      : [notification.activity.actor]
  }

  get renderButton() {
    const { notification } = this.props
    return (
      <ButtonContainer isDefault={this.isDefaultStyle}>
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title="Dismiss"
          placement="bottom"
          disableHoverListener={notification.read}
          disableFocusListener={notification.read}
          disableTouchListener={notification.read}
        >
          {this.isDefaultStyle ? (
            <NotificationButton
              className="read"
              onClick={!notification.read ? this.handleRead : () => null}
              read={notification.read}
            />
          ) : (
            <CloseButton
              className="read"
              onClick={this.handleRead}
              color={v.colors.white}
            />
          )}
        </Tooltip>
      </ButtonContainer>
    )
  }

  render() {
    const { notification } = this.props
    let content
    // Don't display notifications that have been shown already
    if (!notification.activity.target) {
      content = <InlineLoader />
    } else {
      content = (
        <Flex>
          {this.isDefaultStyle && this.renderButton}
          <div>
            {this.isDefaultStyle && (
              <Moment
                date={notification.created_at}
                color={this.styledTextColor}
              />
            )}
            <Activity
              action={notification.activity.action}
              actors={this.actors}
              target={notification.activity.target}
              sourceName={notification.activity.source_name}
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
      <StyledContainer
        isDefault={this.isDefaultStyle}
        className={`${this.shouldHide && 'show-read'}`}
      >
        {content}
      </StyledContainer>
    )
  }
}

Notification.propTypes = {
  notification: MobxPropTypes.objectOrObservableObject.isRequired,
  styleType: PropTypes.oneOf(['default', 'alert']),
}
Notification.defaultProps = {
  styleType: 'default',
}

export default Notification
