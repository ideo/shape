import PropTypes from 'prop-types'
import styled from 'styled-components'

import PlusCircleIcon from '~/ui/icons/PlusCircleIcon'
import MinusCircleIcon from '~/ui/icons/MinusCircleIcon'
import Tooltip from '~/ui/global/Tooltip'
import hexToRgba from '~/utils/hexToRgba'
import { uiStore } from '~/stores'
import v from '~/utils/variables'

const ZoomIconWrapper = styled.div`
  position: fixed;
  border-radius: 27px;
  height: 27px;
  bottom: 30px;
  right: ${props => (uiStore.isMobileXs ? 62 : 34)}px;
  background-color: ${hexToRgba(v.colors.commonLight, v.navOpacity)};
  z-index: ${v.zIndex.zoomControls};
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
ZoomIconWrapper.displayName = 'ZoomIconWrapper'

class FoamcoreZoomControls extends React.Component {
  render() {
    const { onZoomIn, onZoomOut } = this.props

    return (
      <ZoomIconWrapper data-cy="zoom-control">
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title="Zoom out"
          placement="top"
        >
          <button
            className="zoom-icon"
            onClick={onZoomOut}
            tabIndex={0}
            data-cy="foamcoreZoomOut"
          >
            <MinusCircleIcon />
          </button>
        </Tooltip>
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title="Zoom in"
          placement="top"
        >
          <button
            className="zoom-icon"
            onClick={onZoomIn}
            tabIndex={0}
            data-cy="foamcoreZoomIn"
          >
            <PlusCircleIcon />
          </button>
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
