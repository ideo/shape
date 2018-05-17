import Rnd from 'react-rnd'
import localStorage from 'mobx-localstorage'
import { observable, action } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { CloseButton } from '~/ui/global/styled/buttons'
import NotificationIcon from '~/ui/icons/NotificationIcon'
import CommentIcon from '~/ui/icons/CommentIcon'
import styled from 'styled-components'

import v from '~/utils/variables'

const DEFAULT = {
  x: 0,
  y: 83,
}

const MIN_WIDTH = 319
const MIN_HEIGHT = 400
const MAX_WIDTH = 800
const MAX_HEIGHT = 800
const HEADER_HEIGHT = 35

export const POSITION_KEY = 'ActivityLog:position'
export const PAGE_KEY = 'ActivityLog:page'

const ActivityLog = styled.div`
  background-color: ${v.colors.blue};
  box-shadow: 0px 0px 24px -5px rgba(0,0,0,0.33);
  box-sizing: border-box;
  color: white;
  height: 100%;
  padding: 12px 14px;
  width: 100%;
`

const Header = styled.div`
  height: ${HEADER_HEIGHT}px;
  width: 100%;

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

@inject('uiStore')
@observer
class ActivityLogBox extends React.Component {
  @observable position = { x: 0, y: 0, w: MIN_WIDTH, h: MIN_HEIGHT }
  @observable currentPage = 'comments'

  @action componentDidMount() {
    const existingPosition = localStorage.getItem(POSITION_KEY)
    const existingPage = localStorage.getItem(PAGE_KEY)
    this.position = existingPosition || {
      x: document.querySelector('.Grid').offsetWidth - MIN_WIDTH + DEFAULT.x,
      y: DEFAULT.y,
      w: MIN_WIDTH,
      h: MIN_HEIGHT,
    }
    this.currentPage = existingPage || 'comments'
  }

  @action updatePosition({ x, y, w = this.position.w, h = this.position.h }) {
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

  render() {
    return (
      <Rnd
        bounds={'.fixed_boundary'}
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        maxWidth={MAX_WIDTH}
        maxHeight={MAX_HEIGHT}
        position={this.position}
        dragHandleClassName=".activity_log-header"
        size={{ width: this.position.w, height: this.position.h }}
        enableResizing={{
          bottom: true,
          top: true,
          left: false,
          right: false,
        }}
        default={{
          width: MIN_WIDTH,
          height: MIN_HEIGHT,
          x: 10,
          y: 83,
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
      >
        <ActivityLog>
          <Header className="activity_log-header">
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
          </Header>
          <h3 style={{ textAlign: 'center' }}>Go to Object</h3>
        </ActivityLog>
      </Rnd>
    )
  }
}

ActivityLogBox.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ActivityLogBox
