import PropTypes from 'prop-types'
// import { Fragment } from 'react'
import { Flex } from 'reflexbox'
import { observable, action, runInAction } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled, { css } from 'styled-components'
import { Provider as ReduxProvider } from 'react-redux'
import * as SWRTC from '@andyet/simplewebrtc'

import { apiStore, routingStore, uiStore } from '~/stores'
import Moment from '~/ui/global/Moment'
import Tooltip from '~/ui/global/Tooltip'
import { SubduedTitle } from '~/ui/global/styled/typography'
import FollowIcon from '~/ui/icons/FollowIcon'
import v from '~/utils/variables'
import hexToRgba from '~/utils/hexToRgba'
import CommentThumbnail from '~/ui/threads/CommentThumbnail'
import UnresolvedCount from '~/ui/threads/UnresolvedCount'
import VideoChatButton from '~/ui/video_chat/VideoChatButton'
import VideoChatContainer from '~/ui/video_chat/VideoChatContainer'

const store = SWRTC.createStore()

export const threadTitleCss = css`
  position: ${props => (props.sticky ? 'sticky' : 'relative')};
  top: 0;
  z-index: ${v.zIndex.commentHeader};
  display: block;
  width: 100%;
  background-color: ${v.colors.secondaryDark};
  padding: 5px 0px;
  text-align: left;
  font-family: ${v.fonts.sans};
  font-weight: 400;
  font-size: 0.75rem;
`

const StyledHeaderWrapper = styled.div`
  ${threadTitleCss};
  background: linear-gradient(
    ${v.colors.secondaryDark} 0,
    ${v.colors.secondaryDark} 80%,
    ${hexToRgba(v.colors.secondaryDark, 0)} 100%
  );
  padding-bottom: 24px;
`
const StyledHeaderButton = styled.button`
  ${threadTitleCss};
  &:hover {
    background: ${v.colors.secondaryMedium};
  }
`

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  height: ${props => (props.lines === 1 ? 50 : 70)}px;

  .timestamp {
    margin-left: auto;
  }

  .name {
    /* align to bottom */
    margin-top: auto;
    margin-left: 5px;
    font-size: 1.25rem;
    line-height: 1.5rem;
  }
`
StyledHeader.displayName = 'StyledHeader'

const UnreadCountWrapper = styled.div`
  position: relative;
  left: 5px;
  top: 5px;
`
UnreadCountWrapper.displayName = 'UnreadCountWrapper'

export const FollowHolder = styled.span`
  color: ${props =>
    props.isFollowed ? v.colors.commonLight : v.colors.secondaryLight};
  height: 15px;
  margin-left: 10px;
  margin-right: 10px;
  margin-top: 3px;
  width: 15px;
`

@observer
class CommentThreadHeader extends React.Component {
  @observable
  titleLines = 1
  @observable
  joinedVideo = false

  componentDidMount() {
    this.countLines()
    if (routingStore.query) {
      if (routingStore.query.unsubscribe) {
        const { thread } = this.props
        const { users_thread } = thread
        if (thread.key !== apiStore.currentPageThreadKey) return
        if (!users_thread) return
        if (users_thread.currentSubscribed) {
          users_thread.unsubscribedFromEmail = true
          this.toggleSubscribe()
        }
      }
    }
  }

  @action
  countLines = () => {
    if (this.title && this.title.offsetHeight > 24) {
      this.titleLines = 2
    }
  }

  get record() {
    if (this.props.thread) {
      return this.props.thread.record
    }
    return this.props.record
  }

  toggleSubscribe = ev => {
    if (ev) {
      ev.preventDefault()
      ev.stopPropagation()
    }
    const { thread } = this.props

    if (!thread.persisted) return

    const { users_thread } = thread
    if (users_thread) users_thread.unsubscribedFromEmail = false
    const subscribed = users_thread ? users_thread.currentSubscribed : false
    if (subscribed) {
      thread.API_unsubscribe()
      users_thread.subscribed = false
      uiStore.popupAlert({
        iconName: 'Hidden',
        open: 'info',
        prompt: `You have stopped following ${thread.record.name}`,
      })
    } else {
      thread.API_subscribe()
      // if users_thread update the subscribe attr for immediate UI feedback
      if (users_thread) users_thread.subscribed = true
      // if no users thread, it will create one and get it back from the API
    }
  }

  renderUnreadCount = () => {
    const { thread } = this.props
    if (!thread.unreadCount) return null

    return (
      <UnreadCountWrapper>
        <UnresolvedCount count={thread.unreadCount} size={'small'} />
      </UnreadCountWrapper>
    )
  }

  renderFollow = () => {
    const {
      thread: { users_thread },
    } = this.props
    const subscribed = users_thread ? users_thread.currentSubscribed : false
    const tooltipText = subscribed ? 'Unfollow' : 'Follow'
    return (
      <FollowHolder isFollowed={subscribed}>
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title={tooltipText}
          placement="top"
        >
          <span
            onClick={this.toggleSubscribe}
            role="button"
            tabIndex={0}
            onKeyDown={() => null}
          >
            <FollowIcon />
          </span>
        </Tooltip>
      </FollowHolder>
    )
  }

  handleJoinVideo = () => {
    runInAction(() => {
      this.joinedVideo = true
    })
  }

  handleLeaveVideo = () => {
    runInAction(() => {
      this.joinedVideo = false
    })
  }

  render() {
    const { thread, sticky, onClick, expanded } = this.props
    // Wrapper will render a button or div depending on onClick presence
    let Wrapper = StyledHeaderWrapper
    if (onClick) {
      Wrapper = StyledHeaderButton
    }
    if (expanded) console.log('is expanded')
    return (
      <Wrapper sticky={sticky} onClick={onClick}>
        <StyledHeader lines={this.titleLines}>
          {/* left side */}
          <Flex style={{ height: '50px', overflow: 'hidden' }}>
            {thread && (
              <CommentThumbnail
                threadRecord={thread.record}
                subjectRecord={this.record}
                iconTop={this.titleLines === 1 ? 18 : 9}
                useSubjectIcon={false}
              />
            )}
            <span
              className="name"
              data-cy="CommentThreadHeaderName"
              ref={r => {
                this.title = r
              }}
            >
              {this.record.name}
            </span>
          </Flex>

          {/* right side */}
          {thread && (
            <Flex style={{ marginBottom: 'auto' }}>
              <SubduedTitle>
                <Moment date={thread.updated_at} />
              </SubduedTitle>
              {this.renderUnreadCount()}
              {this.renderFollow()}
            </Flex>
          )}
        </StyledHeader>
        {expanded && (
          <ReduxProvider store={store}>
            <SWRTC.Provider
              configUrl={`https://api.simplewebrtc.com/config/guest/${process.env.SIMPLE_WEB_RTC_API_KEY}`}
            >
              <VideoChatButton
                roomName={this.record.name}
                joinedVideo={this.joinedVideo}
                handleLeaveVideo={this.handleLeaveVideo}
                handleJoinVideo={this.handleJoinVideo}
              />
              {this.joinedVideo && (
                <VideoChatContainer roomName={this.record.name} store={store} />
              )}
            </SWRTC.Provider>
          </ReduxProvider>
        )}
      </Wrapper>
    )
  }
}

CommentThreadHeader.propTypes = {
  thread: MobxPropTypes.objectOrObservableObject,
  record: MobxPropTypes.objectOrObservableObject,
  sticky: PropTypes.bool,
  onClick: PropTypes.func,
  expanded: PropTypes.bool,
}
CommentThreadHeader.defaultProps = {
  thread: null,
  record: null,
  sticky: false,
  onClick: null,
  expanded: false,
}

export default CommentThreadHeader
