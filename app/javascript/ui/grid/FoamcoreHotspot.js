import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import {
  HotspotLine,
  StyledHotspot,
  StyledPlusIcon,
} from '~/ui/grid/GridCardHotspot'

@inject('uiStore')
@observer
class FoamcoreHotspot extends React.Component {
  render() {
    const { row, top, onClick, uiStore } = this.props
    const {
      gridSettings: { gutter },
    } = uiStore

    const height = `${gutter}px`
    return (
      <StyledHotspot
        onClick={onClick}
        height={height}
        top={`${top}px`}
        width="100%"
        data-row={row}
        style={{ zIndex: 0 }}
      >
        <HotspotLine height={height} width="100%" />
        <StyledPlusIcon left="calc(-50% + 12px)">+</StyledPlusIcon>
      </StyledHotspot>
    )
  }
}

FoamcoreHotspot.propTypes = {
  row: PropTypes.number.isRequired,
  top: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
}
FoamcoreHotspot.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

FoamcoreHotspot.displayName = 'FoamcoreHotspot'

export default FoamcoreHotspot
