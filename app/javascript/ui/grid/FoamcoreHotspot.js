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
  onClick = () => {
    const { collection, row } = this.props
    collection.API_insertRow(row)
  }

  get hotspotMargins() {
    return { line: 4, icon: -9 }
  }

  render() {
    const { row, top, uiStore } = this.props
    const { icon, line } = this.hotspotMargins
    const {
      gridSettings: { gutter },
    } = uiStore

    return (
      <StyledHotspot
        onClick={this.onClick}
        gutter={uiStore.gridSettings.gutter}
        data-row={row}
        top={`${top}px`}
        width="100%"
      >
        <HotspotLine left={line} height={`${gutter}px`} width="100%" />
        <StyledPlusIcon left={icon}>+</StyledPlusIcon>
      </StyledHotspot>
    )
  }
}

FoamcoreHotspot.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  row: PropTypes.number.isRequired,
  top: PropTypes.number.isRequired,
}
FoamcoreHotspot.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

FoamcoreHotspot.displayName = 'FoamcoreHotspot'

export default FoamcoreHotspot
