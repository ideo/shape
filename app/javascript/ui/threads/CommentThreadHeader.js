// import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { observable, action } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Dotdotdot from 'react-dotdotdot'

import { routingStore } from '~/stores'
import Link from '~/ui/global/Link'
import Moment from '~/ui/global/Moment'
import v, { ITEM_TYPES } from '~/utils/variables'
import CollectionIcon from '~/ui/icons/CollectionIcon'
import CommentIconFilled from '~/ui/icons/CommentIconFilled'
import TextIcon from '~/ui/icons/TextIcon'

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
    width: 25px;
    margin-left: 10px;
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
    return (
      <span className={`unread ${thread.unreadCount && 'show-unread'}`}>
        <span className="inner">
          {thread.unreadCount}
          <CommentIconFilled />
        </span>
      </span>
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
            <span className="timestamp">
              <Moment date={thread.updated_at} />
            </span>
            {this.renderUnreadCount()}
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
