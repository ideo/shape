import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'

// TODO combine shared styled components
const StyledHotspot = styled.div`
  align-items: center;
  display: flex;
  height: ${props => props.gutter}px;
  justify-content: center;
  opacity: 0;
  position: absolute;
  top: ${({ top }) => top}px;
  transition: all 100ms;
  z-index: 100;

  cursor: pointer;
  &:hover,
  &.is-over {
    opacity: ${props => (props.dragging ? 0 : 1)};
  }

  width: 100%;
`

const HotspotLine = styled.div`
  height: ${props => props.gutter}px;
  background: ${v.colors.primaryLight};
  position: relative;
  left: ${props => props.left}px;
  width: 100%;
`

const StyledPlusIcon = styled.div`
  position: relative;
  left: calc(-50% + 12px);
  width: 12px;
  color: ${v.colors.secondaryMedium};
  font-size: 1.5rem;
  cursor: pointer;
`

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

    return (
      <StyledHotspot
        top={top}
        onClick={this.onClick}
        gutter={uiStore.gridSettings.gutter}
        data-row={row}
      >
        <HotspotLine left={line} gutter={uiStore.gridSettings.gutter} />
        <StyledPlusIcon left={icon}>+</StyledPlusIcon>
      </StyledHotspot>
    )
  }
}

FoamcoreHotspot.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  row: PropTypes.number.isRequired,
  cols: PropTypes.number.isRequired,
  top: PropTypes.number,
}
FoamcoreHotspot.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
FoamcoreHotspot.defaultProps = {
  position: 'right',
}

FoamcoreHotspot.displayName = 'FoamcoreHotspot'

export default FoamcoreHotspot
