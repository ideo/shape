import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'
import Icon from '~/ui/global/Icon'

const StyledHotspot = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 100ms;
  color: ${v.colors.teal};
  right: -1.4rem;
  height: 100%;
  width: 2.25rem;
  z-index: 100;
  button {
    height: 50px;
  }

  &:hover, &.is-over {
    opacity: ${props => (props.dragging ? 0 : 1)};
  }
`

const HotspotLine = styled.div`
  height: 100%;
  background: ${v.colors.teal};
  margin-left: 0.8rem;
  width: 0.8rem;
`

const StyledPlusIcon = styled.div`
  position: relative;
  left: -0.6rem;
  width: 12px;
  color: white;
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
    const { dragging } = this.props
    return (
      <StyledHotspot dragging={dragging} onClick={this.clickHotspot}>
        <HotspotLine />
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
