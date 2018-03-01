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
  right: -27px;
  height: 100%;
  width: 36px;
  z-index: 100;

  &:hover, &.is-over {
    opacity: ${props => (props.dragging ? 0 : 1)};
  }
`

const HotspotLine = styled.div`
  height: 100%;
  background: ${v.colors.cyan};
  position: relative;
  left: 7px;
  width: ${props => props.gutter}px;
`

const StyledPlusIcon = styled.div`
  position: relative;
  left: -10px;
  width: 12px;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
`

@inject('uiStore')
@observer
class GridCardHotspot extends React.Component {
  clickHotspot = () => {
    const { uiStore, card } = this.props
    uiStore.openBlankContentTool({ order: card.order })
  }

  render() {
    const { dragging, uiStore } = this.props
    return (
      <StyledHotspot dragging={dragging} onClick={this.clickHotspot}>
        <HotspotLine gutter={uiStore.gridSettings.gutter} />
        <StyledPlusIcon>
          +
        </StyledPlusIcon>
      </StyledHotspot>
    )
  }
}

GridCardHotspot.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  dragging: PropTypes.bool.isRequired,
}
GridCardHotspot.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default GridCardHotspot
