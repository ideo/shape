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

const MIN_WIDTH = 375
const MIN_HEIGHT = 400
const MAX_WIDTH = 800
const MAX_HEIGHT = 800

export const LOCAL_STORAGE_KEY = 'ActivityLog:position'

const ActivityLog = styled.div`
  background-color: ${v.colors.blue};
  color: white;
  padding: 14px;
`

@inject('uiStore')
@observer
class ActivityLogBox extends React.Component {
  @observable position = { x: 0, y: 0 }

  @action componentDidMount() {
    const existingPosition = localStorage.getItem(LOCAL_STORAGE_KEY)
    this.position = existingPosition || {
      x: document.querySelector('.Grid').offsetWidth - MIN_WIDTH + DEFAULT.x,
      y: DEFAULT.y
    }
  }

  @action updatePosition({ x, y }) {
    this.position.x = x
    this.position.y = y
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
        size={{ width: MIN_WIDTH, height: MIN_HEIGHT }}
        default={{
          width: MIN_WIDTH,
          height: MIN_HEIGHT,
          x: 10,
          y: 83,
        }}
        disableDragging={false}
        onDragStop={(ev, d) => { this.updatePosition(d) }}
      >
        <ActivityLog>
          <CloseButton size="lg" onClick={this.handleClose} />
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
