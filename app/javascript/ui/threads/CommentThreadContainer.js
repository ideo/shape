import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Element as ScrollElement, scroller } from 'react-scroll'
import pluralize from 'pluralize'
import styled from 'styled-components'
import Truncator from 'react-truncator'

import { ActivityContainer } from '~/ui/global/styled/layout'
import GoIcon from '~/ui/icons/GoIcon'
import InlineLoader from '~/ui/layout/InlineLoader'
import Notification from '~/ui/notifications/Notification'
import { SmallActionText } from '~/ui/global/styled/typography'
import { ShowMoreButton } from '~/ui/global/styled/forms'
import CommentThread from '~/ui/threads/CommentThread'
import CommentThreadHeader from '~/ui/threads/CommentThreadHeader'

function pluralTypeName(name) {
  return pluralize(name).toLowerCase()
}

const GoIconContainer = styled.span`
  display: inline-block;
  margin-right: 8px;
  vertical-align: middle;
  width: 12px;
`

const JumpButton = styled.button`
  left: 100px;
  min-height: 20px;
  position: relative;
  text-align: center;
  visibility: ${props => props.hide};
  width: calc(100% - 140px);
`

const CommentThreadDrawer = styled.div``

@inject('apiStore', 'uiStore')
@observer
class CommentThreadContainer extends React.Component {
  prevScrollPosition = 0
  // visibleThreads = observable.map({})
  @observable
  bottomOfExpandedThread = false
  @observable
  loadingThreads = false

  scrollOpts = {
    containerId: 'ctc-content',
    delay: 0,
    duration: 350,
    smooth: true,
  }

  constructor(props) {
    super(props)
    runInAction(() => {
      this.loadingThreads = props.loadingThreads
    })
  }

  componentDidUpdate(prevProps) {
    const { expandedThreadKey, loadingThreads } = this.props
    if (!expandedThreadKey && prevProps.expandedThreadKey) {
      // we just closed a thread, so jump back to the prevScrollPosition
      this.containerDiv.scrollTop = this.prevScrollPosition
      // and reset the stored value
      this.prevScrollPosition = 0
    }
    if (loadingThreads !== prevProps.loadingThreads) {
      runInAction(() => {
        this.loadingThreads = loadingThreads
      })
    }
  }

  handleExpandedThreadChange = async thread => {
    if (!thread) return
    // don't try to load comments of our newly constructed threads
    if (thread.persisted) {
      runInAction(() => {
        this.loadingThreads = true
      })
      try {
        await thread.API_fetchComments()
      } finally {
        runInAction(() => {
          this.loadingThreads = false
        })
      }
    }
    // scroll again after any more comments have loaded
    this.scrollToBottom()
  }

  get threads() {
    const { apiStore } = this.props
    // double check to filter out ones you've just unsubscribed from
    // as well as keeping the current page thread available
    return apiStore.currentThreads.filter(
      t =>
        t.key === apiStore.currentPageThreadKey ||
        (t.users_thread && t.users_thread.subscribed)
    )
  }

  get containerDiv() {
    return document.getElementById(this.scrollOpts.containerId)
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

  expandThread = thread => () => {
    const { uiStore } = this.props

    this.prevScrollPosition = this.containerDiv.scrollTop
    uiStore.expandThread(thread.key, { reset: false })
    this.handleExpandedThreadChange(thread)
  }

  closeCurrentThread = () => {
    const { uiStore } = this.props
    uiStore.expandThread(null)
  }

  scrollToTopOfThread = thread => {
    const idx = this.threads.indexOf(thread)
    scroller.scrollTo(`thread-${idx}`, {
      ...this.scrollOpts,
      delay: 0,
    })
  }

  scrollToTop = () => {
    scroller.scrollTo('top', { ...this.scrollOpts, duration: 0 })
  }

  scrollToTopOfNextThread = (
    thread,
    { duration = this.scrollOpts.duration } = {}
  ) => {
    const idx = this.threads.indexOf(thread)
    const nextIdx = idx + 1
    // have to wait for this thread to expand so the next one is actually lower,
    // then we can scroll down to the top of the next thread.
    setTimeout(() => {
      // may have switched pages at some point e.g. on load of ?open=xxx
      if (this.props.uiStore.activityLogPage !== 'comments') return
      scroller.scrollTo(`thread-${nextIdx}`, {
        ...this.scrollOpts,
        duration,
        offset: -1 * this.contentHeight(),
      })
    }, 50)
  }

  scrollToBottom = () => {
    scroller.scrollTo('bottom', {
      ...this.scrollOpts,
      delay: 0,
    })
  }

  afterSubmit = thread => () => {
    this.scrollToBottom()
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
      <CommentThreadDrawer>
        <CommentThread
          thread={thread}
          expanded
          afterSubmit={this.afterSubmit(thread)}
          onEditorHeightChange={this.scrollToBottom}
        />
      </CommentThreadDrawer>
    )
  }

  renderJumpButton() {
    const { uiStore, parentWidth } = this.props
    // const hideJumpButton = this.showJumpToThreadButton ? 'visible' : 'hidden'
    const hideJumpButton = false

    let goBackText = `Go to ${uiStore.viewingRecord &&
      uiStore.viewingRecord.name}`
    if (this.expandedThread) {
      goBackText = 'Go Back'
    }

    return (
      <JumpButton
        hide={hideJumpButton}
        onClick={
          this.expandedThread
            ? this.closeCurrentThread
            : this.jumpToCurrentThread
        }
        className="jumpToThread"
      >
        <SmallActionText style={{ textAlign: 'center' }}>
          <GoIconContainer>
            <GoIcon />
          </GoIconContainer>
          <Truncator
            text={goBackText}
            key="jumpbutton"
            overrideWidth={parentWidth > 600 ? parentWidth : parentWidth - 90}
            overrideStyle={{ display: 'inline-block' }}
          />
        </SmallActionText>
      </JumpButton>
    )
  }

  render() {
    const { apiStore, uiStore } = this.props
    return (
      <Fragment>
        <div
          style={{
            position: 'absolute',
            top: '32px',
            zIndex: 500,
            width: '100%',
          }}
        >
          {this.renderJumpButton()}
          {this.trackedNotifications.map(notification => (
            <Notification
              notification={notification}
              key={notification.id}
              styleType="alert"
            />
          ))}
        </div>
        <ActivityContainer
          moving={uiStore.activityLogMoving}
          id={this.scrollOpts.containerId}
        >
          <ScrollElement name="top" />
          {this.loadingThreads && <InlineLoader fixed background="none" />}
          {this.renderThreads()}
          {this.renderExpandedThread()}
          <div id="ctc-older-threads">
            {apiStore.hasOlderThreads && !this.expandedThread && (
              <ShowMoreButton darkBg onClick={this.loadMorePages}>
                Load older threads...
              </ShowMoreButton>
            )}
          </div>
          <ScrollElement name="bottom" />
        </ActivityContainer>
      </Fragment>
    )
  }
}

CommentThreadContainer.propTypes = {
  parentWidth: PropTypes.number.isRequired,
  loadingThreads: PropTypes.bool.isRequired,
  expandedThreadKey: PropTypes.string,
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
