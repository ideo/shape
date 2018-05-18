import Rnd from 'react-rnd'
import localStorage from 'mobx-localstorage'
import { observable, observe, action } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import { CloseButton } from '~/ui/global/styled/buttons'
import NotificationIcon from '~/ui/icons/NotificationIcon'
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
  w: MIN_WIDTH,
  h: MIN_HEIGHT,
}

export const POSITION_KEY = 'ActivityLog:position'
export const PAGE_KEY = 'ActivityLog:page'

const StyledActivityLog = styled.div`
  background-color: ${v.colors.activityDarkBlue};
  box-shadow: 0px 0px 24px -5px rgba(0,0,0,0.33);
  box-sizing: border-box;
  color: white;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;

  > h3 {
    text-align: center;
  }
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
  color: ${props => (props.active ? 'white' : v.colors.cloudy)};
  height: 19px;
  margin-right: 10px;
  width: 19px;

  &:hover {
    color: white;
  }
`

@inject('apiStore', 'uiStore')
@observer
class ActivityLogBox extends React.Component {
  @observable position = { x: 0, y: 0, w: MIN_WIDTH, h: MIN_HEIGHT }
  @observable currentPage = 'comments'
  disposer = null

  constructor(props) {
    super(props)
    this.draggableRef = React.createRef()
    this.disposer = observe(props.uiStore, 'activityLogOpen', change => {
      if (this.isOffscreen()) {
        this.setToDefaultPosition()
      }
    })
  }

  @action componentDidMount() {
    const existingPosition = localStorage.getItem(POSITION_KEY) || { }
    const existingPage = localStorage.getItem(PAGE_KEY)
    this.position.y = existingPosition.y || DEFAULT.y
    this.position.w = existingPosition.w || DEFAULT.w
    this.position.h = existingPosition.h || DEFAULT.h
    this.position.x = existingPosition.x ||
      this.position.w + DEFAULT.x
    this.currentPage = existingPage || 'comments'
    this.props.apiStore.fetchThreads()
  }

  componentWillUnmount() {
    // cancel the observer
    this.disposer()
  }

  setToDefaultPosition() {
    this.updatePosition({
      x: document.querySelector('.Grid').offsetWidth - this.position.w + DEFAULT.x,
      y: DEFAULT.y,
    })
  }

  @action updatePosition({ x, y, w = this.position.w, h = this.position.h }) {
    console.log('update position', x, y)
    if (y < 0) return
    this.position.x = x
    this.position.y = y
    this.position.w = w
    this.position.h = h
    localStorage.setItem(POSITION_KEY, this.position)
  }

  @action changePage(page) {
    this.currentPage = page
    localStorage.setItem(PAGE_KEY, page)
  }

  isOffscreen() {
    const node = this.draggableRef.current
    if (!node) return false
    const rect = node.getBoundingClientRect()
    const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight)
    const viewWidth = Math.max(document.documentElement.clientWidth, window.innerWidth)
    return !(
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.right <= viewWidth &&
      rect.bottom <= viewHeight
    )
  }

  handleClose = (ev) => {
    const { uiStore } = this.props
    uiStore.update('activityLogOpen', false)
  }

  handleNotifications = (ev) => {
    ev.preventDefault()
    this.changePage('notifications')
  }

  handleComments = (ev) => {
    ev.preventDefault()
    this.changePage('comments')
  }

  get showJumpToThreadButton() {
    const { uiStore } = this.props
    return (uiStore.viewingRecord &&
      (uiStore.viewingRecord.isNormalCollection ||
      uiStore.viewingRecord.internalType === 'items')
    )
  }

  jumpToCurrentThread = () => {
    const { apiStore, uiStore } = this.props
    const thread = apiStore.findThreadForRecord(uiStore.viewingRecord)
    if (!thread) return
    // reset it first, that way if it's expanded offscreen, it will get re-opened/scrolled to
    uiStore.update('expandedThread', null)
    uiStore.update('expandedThread', thread.id)
  }

  get mobileProps() {
    const { uiStore } = this.props
    if (!uiStore.activityLogForceWidth) return {}
    const headerHeight = 185
    const height = window.innerHeight - (headerHeight + MOBILE_Y)
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

  render() {
    const { uiStore } = this.props
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
          bottomRight: true,
          top: true,
          left: false,
          right: false,
        }}
        disableDragging={false}
        onDragStop={(ev, d) => { this.updatePosition(d) }}
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
              </Action>
              <Action
                active={this.currentPage === 'comments'}
                onClick={this.handleComments}
              >
                <CommentIcon />
              </Action>
              <CloseButton size="lg" onClick={this.handleClose} />
            </StyledHeader>
            {this.showJumpToThreadButton &&
              <button onClick={this.jumpToCurrentThread}>
                <h3>Go to {uiStore.viewingRecord.name}</h3>
              </button>
            }
            {!this.showJumpToThreadButton &&
              // take up the same amount of space as the button
              <div style={{ height: '2rem' }} />
            }

            <CommentThreadContainer />

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
