import PropTypes from 'prop-types'
import Rnd from 'react-rnd'
import localStorage from 'mobx-localstorage'
import { observable, action } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { CloseButton } from '~/ui/global/styled/buttons'
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
const HEADER_HEIGHT = 20

export const LOCAL_STORAGE_KEY = 'ActivityLog:position'

const ActivityLog = styled.div`
  background-color: ${v.colors.blue};
  box-shadow: 0px 0px 24px -5px rgba(0,0,0,0.33);
  box-sizing: border-box;
  color: white;
  height: 100%;
  padding: 14px;
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

@inject('uiStore')
@observer
class ActivityLogBox extends React.Component {
  @observable position = { x: 0, y: 0, w: MIN_WIDTH, h: MIN_HEIGHT }

  @action componentDidMount() {
    const existingPosition = localStorage.getItem(LOCAL_STORAGE_KEY)
    this.position = existingPosition || {
      x: document.querySelector('.Grid').offsetWidth - MIN_WIDTH + DEFAULT.x,
      y: DEFAULT.y,
      w: MIN_WIDTH,
      h: MIN_HEIGHT,
    }
  }

  @action updatePosition({ x, y, w = this.position.w, h = this.position.h }) {
    this.position.x = x
    this.position.y = y
    this.position.w = w
    this.position.h = h
    localStorage.setItem(LOCAL_STORAGE_KEY, this.position)
  }

  handleClose = (ev) => {
    const { uiStore } = this.props
    uiStore.update('activityLogOpen', false)
  }

  render() {
    return (
      <Rnd
        bounds={'.Grid'}
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
            <CloseButton size="lg" onClick={this.handleClose} />
          </Header>
          <h3>Activity log</h3>
        </ActivityLog>
      </Rnd>
    )
  }
}

ActivityLogBox.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ActivityLogBox
