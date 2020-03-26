import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'

export const StyledHotspot = styled.div`
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  position: absolute;
  opacity: 0;
  ${({ top }) => top && `top: ${top};`}
  transition: all 100ms;
  /* e.g. "left: -27px;" */
  ${props => `${props.position}: -27px;`} right: -27px;
  width: 36px;
  z-index: 100;

  cursor: pointer;
  &:hover,
  &.is-over {
    opacity: ${props => (props.dragging ? 0 : 1)};
  }
`
StyledHotspot.propTypes = {
  top: PropTypes.string,
  width: PropTypes.string,
}
StyledHotspot.defaultProps = {
  top: null,
  width: '36px',
}
StyledHotspot.displayName = 'StyledHotspot'

export const HotspotLine = styled.div`
  height: ${props => props.height};
  background: ${v.colors.primaryLight};
  position: relative;
  left: ${props => props.left}px;
  width: ${props => props.width}px;
`
HotspotLine.propTypes = {
  left: PropTypes.number,
  height: PropTypes.string,
  width: PropTypes.string,
}
HotspotLine.defaultProps = {
  height: '100%',
  width: '100%',
}
HotspotLine.displayName = 'HotspotLine'

export const StyledPlusIcon = styled.div`
  position: relative;
  left: ${props => props.left}px;
  width: 12px;
  color: ${v.colors.secondaryMedium};
  font-size: 1.5rem;
  cursor: pointer;
`
StyledPlusIcon.displayName = 'StyledPlusIcon'

@inject('uiStore')
@observer
class GridCardHotspot extends React.Component {
  clickHotspot = () => {
    const { uiStore, card, position } = this.props
    const order = card.order + (position === 'right' ? 1 : 0)
    const collection = card.parentCollection
    // confirmEdit will check if we're in a template and need to confirm changes
    if (collection) {
      collection.confirmEdit({
        onConfirm: () => uiStore.openBlankContentTool({ order }),
      })
      return
    }
    uiStore.openBlankContentTool({ order })
  }

  get hotspotMargins() {
    const { position } = this.props
    if (position === 'left') {
      return { line: 8, icon: -5 }
    }
    return { line: 4, icon: -9 }
  }

  render() {
    const { dragging, uiStore, position } = this.props
    const { icon, line } = this.hotspotMargins

    return (
      <StyledHotspot
        position={position}
        dragging={dragging}
        onClick={this.clickHotspot}
      >
        <HotspotLine left={line} width={uiStore.gridSettings.gutter} />
        <StyledPlusIcon left={icon}>+</StyledPlusIcon>
      </StyledHotspot>
    )
  }
}

GridCardHotspot.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  dragging: PropTypes.bool.isRequired,
  position: PropTypes.string,
}
GridCardHotspot.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
GridCardHotspot.defaultProps = {
  position: 'right',
}

GridCardHotspot.displayName = 'GridCardHotspot'

export default GridCardHotspot
