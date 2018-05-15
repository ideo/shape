
import PropTypes from 'prop-types'
import Rnd from 'react-rnd'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { CloseButton } from '~/ui/global/styled/buttons'
import styled from 'styled-components'

import v from '~/utils/variables'

const MIN_WIDTH = '375px'
const MIN_HEIGHT = '400px'
const MAX_WIDTH = '800px'
const MAX_HEIGHT = '1200px'

const ActivityLog = styled.div`
  background-color: ${v.colors.blue};
  color: white;
  padding: 14px;
`

@inject('uiStore')
@observer
class ActivityLogBox extends React.Component {
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
        size={{ width: MIN_WIDTH, height: MIN_HEIGHT }}
        default={{
          width: MIN_WIDTH,
          height: MIN_HEIGHT,
          x: 0,
          y: 83,
        }}
        disableDragging={false}
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
