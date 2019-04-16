import PropTypes from 'prop-types'
import styled from 'styled-components'

import PlusCircleIcon from '~/ui/icons/PlusCircleIcon'
import MinusCircleIcon from '~/ui/icons/MinusCircleIcon'
import Tooltip from '~/ui/global/Tooltip'
import hexToRgba from '~/utils/hexToRgba'
import v from '~/utils/variables'

const ZoomIconWrapper = styled.div`
  position: fixed;
  border-radius: 27px;
  height: 27px;
  top: ${v.headerHeight + 18}px;
  right: 62px;
  background-color: ${hexToRgba(v.colors.commonLight, v.navOpacity)};
  z-index: ${v.zIndex.clickWrapper};
  .zoom-icon {
    outline: none;
    display: inline-block;
    color: ${v.colors.commonDark};
    cursor: pointer;
    height: 23px;
    width: 23px;
    margin: 2px;
    &:first-of-type {
      margin-right: 10px;
    }
    &:hover {
      color: ${v.colors.secondaryDarkest};
    }
    svg {
      height: 100%;
    }
  }
`

class FoamcoreZoomControls extends React.Component {
  render() {
    const { onZoomIn, onZoomOut } = this.props

    return (
      <ZoomIconWrapper>
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title="Zoom out"
          placement="top"
        >
          <div
            className="zoom-icon"
            role="button"
            onClick={onZoomOut}
            onKeyDown={onZoomOut}
            tabIndex={0}
          >
            <MinusCircleIcon />
          </div>
        </Tooltip>
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title="Zoom in"
          placement="top"
        >
          <div
            className="zoom-icon"
            role="button"
            onClick={onZoomIn}
            onKeyDown={onZoomIn}
            tabIndex={0}
          >
            <PlusCircleIcon />
          </div>
        </Tooltip>
      </ZoomIconWrapper>
    )
  }
}

FoamcoreZoomControls.propTypes = {
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
}

export default FoamcoreZoomControls
