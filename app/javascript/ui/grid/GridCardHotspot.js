import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'

const StyledHotspot = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 100ms;
  /* e.g. "left: -27px;" */
  ${props => `${props.position}: -27px;`} right: -27px;
  height: 100%;
  width: 36px;
  z-index: 100;

  cursor: pointer;
  &:hover,
  &.is-over {
    opacity: ${props => (props.dragging ? 0 : 1)};
  }
`

const HotspotLine = styled.div`
  height: 100%;
  background: ${v.colors.primaryLight};
  position: relative;
  left: ${props => props.left}px;
  width: ${props => props.gutter}px;
`

const StyledPlusIcon = styled.div`
  position: relative;
  left: -${props => props.left}px;
  width: 12px;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
`

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
      return { line: 4, icon: 9 }
    }
    return { line: 8, icon: 5 }
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
        <HotspotLine left={line} gutter={uiStore.gridSettings.gutter} />
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
