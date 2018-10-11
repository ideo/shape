import Rnd from 'react-rnd'
import localStorage from 'mobx-localstorage'
import { observable, observe, runInAction, action } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import ClickWrapper from '~/ui/layout/ClickWrapper'
import { CloseButton } from '~/ui/global/styled/buttons'
import NotificationIcon from '~/ui/icons/NotificationIcon'
import NotificationsContainer from '~/ui/notifications/NotificationsContainer'
import { ActivityCount } from '~/ui/notifications/ActivityLogButton'
import CommentIcon from '~/ui/icons/CommentIcon'
import CommentThreadContainer from '~/ui/threads/CommentThreadContainer'
import v from '~/utils/variables'

const MIN_WIDTH = 319
const MIN_HEIGHT = 400
const MAX_WIDTH = 800
const MAX_HEIGHT = 800
const HEADER_HEIGHT = 35
const MOBILE_Y = 300

const DEFAULT = {
  x: 0,
  y: 180,
  w: MIN_WIDTH + 100,
  h: MIN_HEIGHT,
}

export const POSITION_KEY = 'ActivityLog:position'
export const PAGE_KEY = 'ActivityLog:page'

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

@inject('apiStore', 'uiStore')
@observer
class ActivityLogBox extends React.Component {
  disposer = null
  @observable
  movingOrResizing = false

  constructor(props) {
    super(props)
    this.draggableRef = React.createRef()
    // attach observable position to UiStore so other components can know where the ALB is
    this.position = props.uiStore.activityLogPosition
    runInAction(() => {
      if (this.position.w < MIN_WIDTH || this.position.h < MIN_HEIGHT) {
        this.position.w = DEFAULT.w
        this.position.h = DEFAULT.h
      }
    })
    this.disposer = observe(props.uiStore, 'activityLogOpen', change => {
      if (this.isOffscreen()) {
        this.setToDefaultPosition()
      }
    })
  }

  @action
  componentDidMount() {
    const { uiStore } = this.props
    const existingPosition = localStorage.getItem(POSITION_KEY) || {}
    const existingPage = localStorage.getItem(PAGE_KEY)
    uiStore.update('activityLogPage', existingPage || 'comments')
    this.position.y = existingPosition.y || DEFAULT.y
    this.position.w = existingPosition.w || DEFAULT.w
    this.position.h = existingPosition.h || DEFAULT.h
    this.position.x = existingPosition.x || this.defaultX
  }

  componentWillUnmount() {
    // cancel the observer
    this.disposer()
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

  setToDefaultPosition() {
    this.updatePosition({
      x: this.defaultX,
      y: DEFAULT.y,
    })
  }

  @action
  updatePosition({ x, y, w = this.position.w, h = this.position.h }) {
    if (y < 0) return
    this.position.x = x
    this.position.y = y
    this.position.w = w
    this.position.h = h
    localStorage.setItem(POSITION_KEY, this.position)
  }

  @action
  changePage(page) {
    const { uiStore } = this.props
    uiStore.update('activityLogPage', page)
    localStorage.setItem(PAGE_KEY, page)
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
    const { uiStore } = this.props
    uiStore.update('activityLogOpen', false)
    uiStore.expandThread(null)
  }

  handleNotifications = ev => {
    ev.preventDefault()
    this.changePage('notifications')
  }

  handleComments = ev => {
    ev.preventDefault()
    this.changePage('comments')
  }

  @action
  handleMoveStart = () => {
    this.movingOrResizing = true
  }

  @action
  handleMoveStop = () => {
    this.movingOrResizing = false
  }

  get mobileProps() {
    const { uiStore } = this.props
    if (!uiStore.activityLogForceWidth) return {}
    const height = window.innerHeight - MOBILE_Y
    return {
      minWidth: uiStore.activityLogForceWidth,
      minHeight: height,
      position: {
        x: 0,
        y: MOBILE_Y,
      },
      size: {
        width: uiStore.activityLogForceWidth,
        height,
      },
      enableResizing: {},
      disableDragging: true,
    }
  }

  renderComments = () => <CommentThreadContainer />

  renderNotifications = () => <NotificationsContainer />

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
        position={{ x: this.position.x, y: this.position.y }}
        dragHandleClassName=".activity_log-header"
        size={{
          width: this.position.w,
          height: this.position.h,
        }}
        enableResizing={{
          bottom: true,
          bottomLeft: true,
          bottomRight: true,
          top: true,
          topLeft: true,
          topRight: true,
          left: true,
          right: true,
        }}
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
        {...this.mobileProps}
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
              <CloseButton size="lg" onClick={this.handleClose} />
            </StyledHeader>
            {this.currentPage === 'comments'
              ? this.renderComments()
              : this.renderNotifications()}

            {/* clickwrapper prevents ActivityLog text selection / scrolling during move */}
            {this.movingOrResizing && <ClickWrapper top={HEADER_HEIGHT * 2} />}
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
