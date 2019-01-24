// import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { observable, action } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Dotdotdot from 'react-dotdotdot'

import { routingStore, uiStore } from '~/stores'
import CollectionIcon from '~/ui/icons/CollectionIcon'
import CommentIconFilled from '~/ui/icons/CommentIconFilled'
import Link from '~/ui/global/Link'
import FollowIcon from '~/ui/icons/FollowIcon'
import TextIcon from '~/ui/icons/TextIcon'
import Tooltip from '~/ui/global/Tooltip'
import v, { ITEM_TYPES } from '~/utils/variables'

const StyledHeader = styled.div`
  align-items: flex-start;
  display: flex;
  height: ${props => (props.lines === 1 ? 50 : 70)}px;

  *:first-child {
    margin-right: 8px;
  }

  .timestamp {
    margin-left: auto;
  }

  .name {
    font-size: 1.25rem;
    line-height: 1.5rem;
    text-transform: uppercase;
  }
  .unread {
    color: ${v.colors.alert};
    display: flex;
    flex-basis: content;
    height: 12px;
    width: 20px;
    margin-left: 4px;
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

export const ThumbnailHolder = styled.span`
  display: block;
  flex-shrink: 0;
  height: 50px;
  width: 50px;
  img,
  svg {
    flex-shrink: 0;
    height: 100%;
    object-fit: cover;
    width: 100%;
  }
`
ThumbnailHolder.displayName = 'ThumbnailHolder'

export const FollowHolder = styled.span`
  color: ${props =>
    props.isFollowed ? v.colors.commonLight : v.colors.secondaryLight};
  height: 15px;
  margin-top: 3px;
  width: 15px;
`

@observer
class CommentThreadHeader extends React.Component {
  @observable
  titleLines = 1

  componentDidMount() {
    this.countLines()
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
    ev.preventDefault()
    const { thread } = this.props
    const { users_thread } = thread
    if (users_thread.subscribed) {
      thread.API_unsubscribe()
      users_thread.subscribed = false
      uiStore.popupAlert({
        iconName: 'Hidden',
        open: 'info',
        prompt: `You have stopped following ${thread.record.name}`,
      })
    } else {
      thread.API_subscribe()
      users_thread.subscribed = true
    }
  }

  renderThumbnail() {
    const { record } = this
    let content
    if (record.internalType === 'items') {
      if (record.type === ITEM_TYPES.TEXT) {
        content = <TextIcon viewBox="0 0 70 70" />
      } else {
        content = <img src={record.filestack_file_url} alt="Text" />
      }
    } else {
      content = <CollectionIcon viewBox="50 50 170 170" />
      if (record.cover.image_url) {
        content = <img src={record.cover.image_url} alt={record.name} />
      }
    }
    return (
      <Link to={this.objectLink()}>
        <ThumbnailHolder>{content}</ThumbnailHolder>
      </Link>
    )
  }

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
    if (!users_thread) return null
    const tooltipText = users_thread.subscribed ? 'Unfollow' : 'Follow'
    return (
      <FollowHolder isFollowed={users_thread.subscribed}>
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title={tooltipText}
          placement="top"
        >
          <button onClick={this.toggleSubscribe}>
            <FollowIcon />
          </button>
        </Tooltip>
      </FollowHolder>
    )
  }

  render() {
    const { thread } = this.props

    return (
      <StyledHeader lines={this.titleLines}>
        {this.renderThumbnail()}
        <Dotdotdot clamp={2}>
          <span
            className="name"
            ref={r => {
              this.title = r
            }}
          >
            {this.record.name}
          </span>
        </Dotdotdot>
        {thread && (
          <Fragment>
            {this.renderUnreadCount()}
            {this.renderFollow()}
          </Fragment>
        )}
      </StyledHeader>
    )
  }
}

CommentThreadHeader.propTypes = {
  thread: MobxPropTypes.objectOrObservableObject,
  record: MobxPropTypes.objectOrObservableObject,
}
CommentThreadHeader.defaultProps = {
  thread: null,
  record: null,
}

export default CommentThreadHeader
