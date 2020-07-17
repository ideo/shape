import PropTypes from 'prop-types'

import {
  HotspotLine,
  StyledHotspot,
  StyledPlusIcon,
} from '~/ui/grid/GridCardHotspot'
import v from '~/utils/variables'

class FoamcoreHotspot extends React.Component {
  render() {
    const { row, col, horizontal, relativeZoomLevel, onClick } = this.props
    let { gridH, gridW, gutter } = v.defaultGridSettings
    gutter = gutter / relativeZoomLevel
    gridH = gridH / relativeZoomLevel
    gridW = gridW / relativeZoomLevel

    let top = (gridH + gutter) * (row + 1) - gutter
    let height = `${gutter}px`
    let width = '100%'
    let left = 0
    if (!horizontal) {
      // non-horizontal hotspots just fit in 1x1 gutter
      width = `${gutter}px`
      height = `${gridH}px`
      top = (gridH + gutter) * row
      left = (gridW + gutter) * col - 14 / relativeZoomLevel
    }
    const leftAdjust = 7 / relativeZoomLevel
    return (
      <StyledHotspot
        onClick={onClick}
        height={height}
        width={width}
        top={`${top}px`}
        left={`${left}px`}
        data-row={row}
        data-col={col}
        zIndex={0}
        data-cy={`FoamcoreHotspot-${row}:${col}`}
      >
        <HotspotLine
          height={height}
          left={0}
          width={width}
          style={{ position: horizontal ? 'relative' : 'absolute' }}
        />
        <StyledPlusIcon width="auto" left={`calc(-50% + ${leftAdjust}px)`}>
          +
        </StyledPlusIcon>
      </StyledHotspot>
    )
  }
}

FoamcoreHotspot.propTypes = {
  row: PropTypes.number.isRequired,
  col: PropTypes.number,
  // relativeZoomLevel is needed so that the hotspot can be scaled appropriately
  relativeZoomLevel: PropTypes.number.isRequired,
  // `horizontal` indicates that the hotspot spans the width of the grid
  horizontal: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
}
FoamcoreHotspot.defaultProps = {
  col: null,
}

FoamcoreHotspot.displayName = 'FoamcoreHotspot'

export default FoamcoreHotspot
