import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Element as ScrollElement } from 'react-scroll'
import pluralize from 'pluralize'
import styled from 'styled-components'
import Truncator from 'react-truncator'
import VisibilitySensor from 'react-visibility-sensor'

import { ActivityContainer } from '~/ui/global/styled/layout'
import GoIcon from '~/ui/icons/GoIcon'
import InlineLoader from '~/ui/layout/InlineLoader'
import Notification from '~/ui/notifications/Notification'
import { SmallActionText } from '~/ui/global/styled/typography'
import { ShowMoreButton } from '~/ui/global/styled/forms'
import CommentThread from '~/ui/threads/CommentThread'
import CommentThreadHeader from '~/ui/threads/CommentThreadHeader'
import v from '~/utils/variables'

function pluralTypeName(name) {
  return pluralize(name).toLowerCase()
}

const GoIconContainer = styled.button`
  position: absolute;
  left: 5px;
  display: inline-block;
  margin: 5px;
  vertical-align: middle;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${v.colors.secondaryMedium};
  &:hover {
    background: ${v.colors.secondaryLight};
  }
`

const JumpButton = styled.button`
  left: 100px;
  top: 12px;
  min-height: 20px;
  position: relative;
  text-align: center;
  width: calc(100% - 140px);
  &:hover {
    span {
      color: ${v.colors.commonMedium};
    }
  }
`
JumpButton.displayName = 'JumpButton'

@inject('apiStore', 'uiStore')
@observer
class CommentThreadContainer extends React.Component {
  prevScrollPosition = 0
  @observable
  bottomOfExpandedThread = false
  @observable
  isBottomVisible = false

  componentDidUpdate(prevProps) {
    const { expandedThreadKey } = this.props
    if (
      !expandedThreadKey &&
      prevProps.expandedThreadKey &&
      this.containerDiv
    ) {
      // we just closed a thread, so jump back to the prevScrollPosition
      this.containerDiv.scrollTop = this.prevScrollPosition
      // and reset the stored value
      this.prevScrollPosition = 0
    }
  }

  get threads() {
    const { apiStore } = this.props
    // double check to filter out ones you've just unsubscribed from
    // as well as keeping the current page thread available
    return apiStore.currentThreads.filter(
      t =>
        apiStore.alwaysShowCurrentThread(t.key) ||
        (t.users_thread && t.users_thread.subscribed)
    )
  }

  get containerDiv() {
    return document.getElementById(v.commentScrollOpts.containerId)
  }

  get containerDivScrollTop() {
    const { containerDiv } = this
    return containerDiv ? containerDiv.scrollTop : 0
  }

  get expandedThread() {
    const { uiStore } = this.props
    return this.threads.filter(t => t.key === uiStore.expandedThreadKey)[0]
  }

  get trackedNotifications() {
    const { apiStore, uiStore } = this.props
    const notifications = Array.from(apiStore.recentNotifications.values())
    return notifications.filter(notification => {
      // notification may have been cleared out
      if (!notification) return false
      const { activity } = notification
      // bug?
      if (!activity) return false
      if (activity.action === 'mentioned') return true
      const identifier = `${pluralTypeName(activity.target_type)}${
        activity.target_id
      }`
      return uiStore.trackedRecords.get(identifier)
    })
  }

  contentHeight = () => {
    let h = this.containerDiv ? this.containerDiv.clientHeight : 0
    // TODO: we may not actually use this "older threads" button
    h -= document.getElementById('ctc-older-threads').clientHeight || 0
    return h
  }

  expandThread = thread => async () => {
    if (!thread) return
    const { uiStore } = this.props

    this.prevScrollPosition = this.containerDivScrollTop
    uiStore.expandThread(thread.key, { reset: false })

    // don't try to load comments of our newly constructed threads
    if (thread.persisted) {
      await thread.API_fetchComments()
    }
    // scroll again after any more comments have loaded
    uiStore.scrollToBottomOfComments()
  }

  closeCurrentThread = () => {
    const { uiStore, updateContainerSize } = this.props
    uiStore.expandThread(null)
    // reset back to whatever it was
    updateContainerSize({ reset: true })
  }

  isExpanded = key => {
    const { uiStore } = this.props
    return uiStore.expandedThreadKey === key
  }

  jumpToCurrentThread = () => {
    const { apiStore, uiStore } = this.props
    const thread = apiStore.findThreadForRecord(uiStore.viewingRecord)
    if (!thread) return false
    // expandThread returns a function, so we call it
    this.expandThread(thread)()
  }

  loadMorePages = () => {
    const { apiStore, uiStore } = this.props
    uiStore.expandThread(null)
    apiStore.loadNextThreadPage()
  }

  scrollToBottomOfThread = () => {
    const { uiStore } = this.props
    const { replyingToCommentId } = uiStore
    // if replyingToCommentId is present, it will scroll to the bottom of those replies
    uiStore.scrollToBottomOfComments(replyingToCommentId, {
      duration: 0,
    })
  }

  handleScrollOnCommentUpdate = async () => {
    if (!this.isBottomVisible) return
    const { expandedThread } = this
    expandedThread.API_markViewed()
    this.scrollToBottomOfThread()
  }

  handleBottomVisibility = async isVisible => {
    const { expandedThread } = this
    // if we reached the bottom and we're viewing an expanded thread
    if (isVisible && expandedThread) {
      await expandedThread.API_markViewed()
    }
    runInAction(() => {
      this.isBottomVisible = isVisible
    })
  }

  renderThreads = () => {
    if (!!this.expandedThread) return null
    return this.threads.map((thread, i) => (
      <ScrollElement name={`thread-${i}`} key={thread.key}>
        <CommentThreadHeader
          thread={thread}
          onClick={this.expandThread(thread)}
        />
      </ScrollElement>
    ))
  }

  renderExpandedThread() {
    const thread = this.expandedThread
    if (!thread) return null
    return (
      <CommentThread
        thread={thread}
        loadingThreads={this.props.loadingThreads}
        commentCount={thread.visibleCommentsAndRepliesCount}
        afterSubmit={this.scrollToBottomOfThread}
        onEditorHeightChange={this.scrollToBottomOfThread}
        updateContainerSize={this.props.updateContainerSize}
        handleScrollOnCommentUpdate={this.handleScrollOnCommentUpdate}
      />
    )
  }

  renderGoBackButton() {
    if (!this.expandedThread) return null

    return (
      <GoIconContainer onClick={this.closeCurrentThread}>
        <GoIcon />
      </GoIconContainer>
    )
  }

  get showJumpButton() {
    const { expandedThread } = this
    const { uiStore } = this.props
    const { viewingRecord } = uiStore
    // show the jump button if we're not on viewingRecord's expanded thread
    return (
      viewingRecord &&
      !viewingRecord.isUserCollection &&
      (!expandedThread || expandedThread.record !== viewingRecord)
    )
  }

  renderJumpButton() {
    const { showJumpButton } = this
    if (!showJumpButton) return null

    const { uiStore, parentWidth } = this.props
    return (
      <JumpButton onClick={this.jumpToCurrentThread} className="jumpToThread">
        <SmallActionText style={{ textAlign: 'center' }}>
          <Truncator
            text={`Go to ${uiStore.viewingRecord.name}`}
            key="jumpbutton"
            overrideWidth={parentWidth > 600 ? parentWidth : parentWidth - 90}
            overrideStyle={{ display: 'inline-block' }}
          />
        </SmallActionText>
      </JumpButton>
    )
  }

  renderHeader() {
    return (
      <div
        style={{
          position: 'absolute',
          top: '32px',
          width: '100%',
        }}
      >
        {this.renderGoBackButton()}
        {this.renderJumpButton()}
        {this.trackedNotifications.map(notification => (
          <Notification
            notification={notification}
            key={notification.id}
            styleType="alert"
          />
        ))}
      </div>
    )
  }

  render() {
    const { apiStore, uiStore, loadingThreads } = this.props
    return (
      <Fragment>
        {this.renderHeader()}

        <ActivityContainer
          // bigger margin top because of the back button...
          style={{ marginTop: '35px' }}
          moving={uiStore.activityLogMoving}
          id={v.commentScrollOpts.containerId}
        >
          {loadingThreads && <InlineLoader fixed background="none" />}
          {this.renderThreads()}
          {this.renderExpandedThread()}
          <div id="ctc-older-threads">
            {apiStore.hasOlderThreads && !this.expandedThread && (
              <ShowMoreButton
                darkBg
                onClick={this.loadMorePages}
                style={{ marginTop: '20px' }}
              >
                Load older threads...
              </ShowMoreButton>
            )}
          </div>
          <VisibilitySensor onChange={this.handleBottomVisibility}>
            <ScrollElement name={v.commentScrollOpts.bottom} />
          </VisibilitySensor>
        </ActivityContainer>
      </Fragment>
    )
  }
}

CommentThreadContainer.propTypes = {
  parentWidth: PropTypes.number.isRequired,
  loadingThreads: PropTypes.bool.isRequired,
  expandedThreadKey: PropTypes.string,
  updateContainerSize: PropTypes.func.isRequired,
}
CommentThreadContainer.defaultProps = {
  expandedThreadKey: null,
}
CommentThreadContainer.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
CommentThreadContainer.displayName = 'CommentThreadContainer'

export default CommentThreadContainer
