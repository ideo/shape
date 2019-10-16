import PropTypes from 'prop-types'
// import { Fragment } from 'react'
import { Flex } from 'reflexbox'
import { observable, action } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled, { css } from 'styled-components'

import { apiStore, routingStore, uiStore } from '~/stores'
import CommentIconFilled from '~/ui/icons/CommentIconFilled'
import Moment from '~/ui/global/Moment'
import Tooltip from '~/ui/global/Tooltip'
import { SubduedTitle } from '~/ui/global/styled/typography'
import FollowIcon from '~/ui/icons/FollowIcon'
import v from '~/utils/variables'
import hexToRgba from '~/utils/hexToRgba'
import CommentThumbnail from '~/ui/threads/CommentThumbnail'

export const threadTitleCss = css`
  position: ${props => (props.sticky ? 'sticky' : 'relative')};
  top: 0;
  z-index: ${v.zIndex.commentMentions + v.zIndex.commentHeader};
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
  .unread {
    color: ${v.colors.alert};
    display: flex;
    flex-basis: content;
    height: 12px;
    width: ${props => (props.lines === 1 ? 20 : 25)}px;
    margin-left: 8px;
    margin-top: 5px;
    svg {
      margin-left: 4px;
      height: 100%;
      width: 100%;
    }
    .inner {
      display: flex;
      opacity: 0;
      transition: opacity 1s 2s ease;
    }
    &.show-unread .inner {
      opacity: 1;
    }
  }
`
StyledHeader.displayName = 'StyledHeader'

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

  objectLink() {
    const { record } = this

    if (record.internalType === 'collections') {
      return routingStore.pathTo('collections', record.id)
    } else if (record.internalType === 'items') {
      return routingStore.pathTo('items', record.id)
    }
    return routingStore.pathTo('homepage')
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

  // TODO: extract to individual component
  renderUnreadCount = () => {
    const { thread } = this.props
    if (!thread.unreadCount) return null

    return (
      <span className={`unread ${thread.unreadCount && 'show-unread'}`}>
        <span className="inner">
          {thread.unreadCount}
          <CommentIconFilled />
        </span>
      </span>
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

  render() {
    const { thread, sticky, onClick } = this.props
    // Wrapper will render a button or div depending on onClick presence
    let Wrapper = StyledHeaderWrapper
    if (onClick) {
      Wrapper = StyledHeaderButton
    }
    return (
      <Wrapper sticky={sticky} onClick={onClick}>
        <StyledHeader lines={this.titleLines}>
          {/* left side */}
          <Flex style={{ height: '50px', overflow: 'hidden' }}>
            <CommentThumbnail
              record={this.record}
              iconTop={this.titleLines === 1 ? 18 : 9}
            />
            <span
              className="name"
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
      </Wrapper>
    )
  }
}

CommentThreadHeader.propTypes = {
  thread: MobxPropTypes.objectOrObservableObject,
  record: MobxPropTypes.objectOrObservableObject,
  sticky: PropTypes.bool,
  onClick: PropTypes.func,
}
CommentThreadHeader.defaultProps = {
  thread: null,
  record: null,
  sticky: false,
  onClick: null,
}

export default CommentThreadHeader
