import _ from 'lodash'
import Rnd from 'react-rnd'
import localStorage from 'mobx-localstorage'
import { observe, runInAction, action } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import InlineCollectionTest from '~/ui/test_collections/InlineCollectionTest'
import { CloseButton } from '~/ui/global/styled/buttons'
import NotificationIcon from '~/ui/icons/NotificationIcon'
import NotificationsContainer from '~/ui/notifications/NotificationsContainer'
import TestCollectionIcon from '~/ui/icons/TestCollectionIcon'
import { ActivityCount } from '~/ui/notifications/ActivityLogButton'
import CommentIcon from '~/ui/icons/CommentIcon'
import CommentThreadContainer from '~/ui/threads/CommentThreadContainer'
import v, {
  ACTIVITY_LOG_PAGE_KEY,
  ACTIVITY_LOG_POSITION_KEY,
} from '~/utils/variables'

const MIN_WIDTH = 319
const MIN_HEIGHT = 200
const MAX_WIDTH = 800
const MAX_HEIGHT = 800
const HEADER_HEIGHT = 35

const DEFAULT = {
  x: 0,
  y: 180,
  w: MIN_WIDTH + 100,
  h: MIN_HEIGHT + 200,
}

const StyledActivityLog = styled.div`
  background-color: ${v.colors.secondaryDark};
  box-shadow: 0px 0px 24px -5px rgba(0, 0, 0, 0.33);
  box-sizing: border-box;
  color: white;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
`

const StyledHeader = styled.div`
  height: ${HEADER_HEIGHT}px;
  width: 100%;
  padding: 12px 14px 0;

  &:hover,
  &:active {
    cursor: move;
  }
  user-select: none;
`

const Action = styled.button`
  color: ${props => (props.active ? 'white' : v.colors.commonDark)};
  height: 19px;
  margin-right: 10px;
  position: relative;
  width: 19px;

  &:hover {
    color: white;
  }
`

const TestAction = styled(Action)`
  height: 32px;
  margin-top: -7px;
  vertical-align: top;
  width: 32px;
`

@inject('apiStore', 'uiStore')
@observer
class ActivityLogBox extends React.Component {
  disposers = {}

  constructor(props) {
    super(props)
    const { apiStore, uiStore } = props
    this.draggableRef = React.createRef()
    // attach observable position to UiStore so other components can know where the ALB is
    this.position = uiStore.activityLogPosition
    runInAction(() => {
      if (this.position.w < MIN_WIDTH || this.position.h < MIN_HEIGHT) {
        this.position.w = DEFAULT.w
        this.position.h = DEFAULT.h
      }
    })
    this.disposers.activityLogOpen = observe(
      props.uiStore,
      'activityLogOpen',
      async change => {
        if (change.newValue === true) {
          // if we just opened the activity log, make sure the CommentThread is loaded
          await apiStore.setupCommentThreadAndMenusForPage(
            uiStore.viewingRecord,
            { initialPageLoad: false }
          )
          if (!this.liveTestCollectionId && this.currentPage === 'tests') {
            uiStore.setActivityLogPage('comments')
          }
        }
        if (this.isOffscreen()) {
          this.setToDefaultPosition()
        }
      }
    )
    this.disposers.activityLogForceWidth = observe(
      props.uiStore,
      'activityLogForceWidth',
      change => {
        if (change.newValue !== change.oldValue) {
          // if we resized the window check if we need to reset the position
          this.resetPosition()
        }
      }
    )
  }

  @action
  componentDidMount() {
    const { uiStore } = this.props
    const { activityLogPage } = uiStore
    const existingPage = localStorage.getItem(ACTIVITY_LOG_PAGE_KEY)
    if (
      existingPage &&
      existingPage !== activityLogPage &&
      (existingPage !== 'tests' || this.liveTestCollectionId)
    ) {
      uiStore.setActivityLogPage(existingPage)
    }
    this.resetPosition()
  }

  componentWillUnmount() {
    // cancel the observer
    _.each(this.disposers, disposer => disposer())
  }

  @action
  resetPosition = () => {
    const { uiStore } = this.props
    if (uiStore.isTouchDevice || uiStore.isMobileXs) {
      this.setToFixedPosition()
      return
    }
    const existingPosition =
      localStorage.getItem(ACTIVITY_LOG_POSITION_KEY) || {}
    this.position.y = existingPosition.y || DEFAULT.y
    this.position.w = existingPosition.w || DEFAULT.w
    this.position.h = existingPosition.h || DEFAULT.h
    this.position.x = existingPosition.x || this.defaultX
  }

  get currentPage() {
    const { uiStore } = this.props
    return uiStore.activityLogPage
  }

  get defaultX() {
    let { x } = DEFAULT
    if (document.querySelector('#AppWrapper')) {
      x +=
        document.querySelector('#AppWrapper').getBoundingClientRect().right -
        this.position.w
    }
    return x
  }

  get liveTestCollectionId() {
    const { uiStore } = this.props
    const { viewingCollection, viewingCollectionId } = uiStore
    // this way we observe the change in viewingCollection by id
    if (viewingCollectionId) {
      return viewingCollection.liveTestCollectionId
    }
    return null
  }

  setToDefaultPosition() {
    this.updatePosition({
      x: this.defaultX,
      y: DEFAULT.y,
    })
  }

  setToFixedPosition() {
    const { width, height } = this.touchDeviceFixedSize

    this.updatePosition({
      x: 0,
      y: 0,
      w: width,
      h: height,
    })
  }

  @action
  updatePosition = ({
    x = null,
    y = null,
    w = null,
    h = null,
    temporary = false,
    reset = false,
  }) => {
    const existingPosition =
      localStorage.getItem(ACTIVITY_LOG_POSITION_KEY) || {}
    if (y < 0) return
    if (reset) {
      this.resetPosition()
      return
    }

    const positionArgs = {
      x,
      y,
      w,
      h,
    }

    if (temporary && this.liveTestCollectionId) {
      // don't shrink the height if we have a test collection
      delete positionArgs.h
    }

    _.each(positionArgs, (value, field) => {
      if (value !== null) {
        this.position[field] = value
      } else {
        this.position[field] = existingPosition[field] || this.position[field]
      }
    })
    if (!temporary) {
      localStorage.setItem(ACTIVITY_LOG_POSITION_KEY, this.position)
    } else {
      // temporarily set this, but don't store it in localStorage
      this.position.h = _.min([existingPosition.h, positionArgs.h])
    }
    return this.position
  }

  @action
  changePage(page) {
    const { uiStore } = this.props
    uiStore.setActivityLogPage(page)
  }

  isOffscreen() {
    const node = this.draggableRef.current
    if (!node) return false
    const rect = node.getBoundingClientRect()
    const viewHeight = Math.max(
      document.documentElement.clientHeight,
      window.innerHeight
    )
    const viewWidth = Math.max(
      document.documentElement.clientWidth,
      window.innerWidth
    )
    return !(
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.right - (MIN_WIDTH - 100) <= viewWidth &&
      rect.bottom - (MIN_HEIGHT - 100) <= viewHeight
    )
  }

  handleClose = ev => {
    const { uiStore, apiStore } = this.props
    uiStore.setCommentingOnRecord(null)
    uiStore.update('activityLogOpen', false)
    apiStore.collapseReplies()
  }

  handleNotifications = ev => {
    ev.preventDefault()
    this.changePage('notifications')
  }

  handleComments = ev => {
    ev.preventDefault()
    this.changePage('comments')
  }

  handleTests = ev => {
    ev.preventDefault()
    this.changePage('tests')
  }

  @action
  handleMoveStart = () => {
    this.props.uiStore.update('activityLogMoving', true)
  }

  @action
  handleMoveStop = () => {
    this.props.uiStore.update('activityLogMoving', false)
  }

  get defaultPositionProps() {
    return { x: this.position.x, y: this.position.y }
  }

  get touchDeviceFixedSize() {
    const { uiStore } = this.props
    const { isIOSMultipleColumns, isAndroidMultipleColumns } = uiStore

    // iPhone landscape won't show the close button unless it's less than the max width
    const touchDeviceMaxWidth = MAX_WIDTH - 150
    const width =
      isIOSMultipleColumns || isAndroidMultipleColumns
        ? touchDeviceMaxWidth
        : window.innerWidth
    return {
      width,
      height: window.innerHeight,
    }
  }

  get defaultResizingProps() {
    return {
      bottom: true,
      bottomLeft: true,
      bottomRight: true,
      top: true,
      topLeft: true,
      topRight: true,
      left: true,
      right: true,
    }
  }

  /** Overrides Rnd props for mobile devices */
  get overrideProps() {
    const { uiStore } = this.props
    const {
      activityLogForceWidth,
      isTouchDevice,
      isIOSMultipleColumns,
      isAndroidMultipleColumns,
    } = uiStore

    if (!activityLogForceWidth && !isTouchDevice) {
      // override only for non-touch/desktop devices
      return {}
    }

    // disable dragging and resizing, and set default position for devices with a fixed activity box
    if (isTouchDevice) {
      const { width, height } = this.touchDeviceFixedSize
      const x =
        isIOSMultipleColumns || isAndroidMultipleColumns
          ? window.innerWidth - width
          : 0
      return {
        disableDragging: true,
        enableResizing: {},
        maxHeight: window.innerHeight,
        position: {
          x,
          y: 0,
        },
        size: {
          width,
          height,
        },
      }
    }
  }

  get renderComments() {
    return (
      <CommentThreadContainer
        parentWidth={this.position.w}
        loadingThreads={this.props.apiStore.loadingThreads}
        expandedThreadKey={this.props.uiStore.expandedThreadKey}
        updateContainerSize={this.updatePosition}
      />
    )
  }

  get renderNotifications() {
    return <NotificationsContainer />
  }

  get renderTest() {
    return <InlineCollectionTest testCollectionId={this.liveTestCollectionId} />
  }

  get renderPage() {
    switch (this.currentPage) {
      case 'notifications':
        return this.renderNotifications
      case 'tests':
        return this.renderTest
      case 'comments':
      default:
        return this.renderComments
    }
  }

  render() {
    const { apiStore, uiStore } = this.props
    if (!uiStore.activityLogOpen) return null
    return (
      <Rnd
        className="activity_log-draggable"
        style={{ zIndex: v.zIndex.activityLog }}
        bounds={'.fixed_boundary'}
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        maxWidth={MAX_WIDTH}
        maxHeight={MAX_HEIGHT}
        position={this.defaultPositionProps}
        dragHandleClassName=".activity_log-header"
        size={{
          width: this.position.w,
          height: this.position.h,
        }}
        enableResizing={this.defaultResizingProps}
        disableDragging={false}
        onDragStart={this.handleMoveStart}
        onResizeStart={this.handleMoveStart}
        onResizeStop={this.handleMoveStop}
        onDragStop={(ev, d) => {
          this.handleMoveStop()
          this.updatePosition(d)
        }}
        onResize={(ev, dir, ref, delta, position) => {
          const fullPosition = Object.assign({}, position, {
            w: ref.offsetWidth,
            h: ref.offsetHeight,
          })
          this.updatePosition(fullPosition)
        }}
        {...this.overrideProps}
      >
        <div ref={this.draggableRef} style={{ height: '100%' }}>
          <StyledActivityLog>
            <StyledHeader className="activity_log-header">
              <Action
                active={this.currentPage === 'notifications'}
                onClick={this.handleNotifications}
              >
                <NotificationIcon />
                {apiStore.unreadNotificationsCount > 0 && (
                  <ActivityCount size="sm">
                    {apiStore.unreadNotificationsCount}
                  </ActivityCount>
                )}
              </Action>
              <Action
                active={this.currentPage === 'comments'}
                onClick={this.handleComments}
              >
                <CommentIcon />
                {apiStore.unreadCommentsCount > 0 && (
                  <ActivityCount size="sm">
                    {apiStore.unreadCommentsCount}
                  </ActivityCount>
                )}
              </Action>
              {this.liveTestCollectionId && (
                <TestAction
                  className="liveTest"
                  active={this.currentPage === 'tests'}
                  onClick={this.handleTests}
                >
                  <TestCollectionIcon />
                </TestAction>
              )}
              <CloseButton size="lg" onClick={this.handleClose} />
            </StyledHeader>
            {this.renderPage}
          </StyledActivityLog>
        </div>
      </Rnd>
    )
  }
}

ActivityLogBox.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ActivityLogBox
