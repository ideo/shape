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

  right: -1.25rem;
  height: 100%;
  width: 2.25rem;
  button {
    height: 50px;
  }

  &:hover, &.is-over {
    opacity: ${props => (props.dragging ? 0 : 1)};
  }
`

const HotspotLine = styled.div`
  height: 80%;
  padding-left: 2.5rem;
  border-right: 2px solid ${v.colors.teal};
`

const StyledPlusIcon = styled.div`
  position: relative;
  left: -1rem;
  background: white;
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
      <StyledHotspot dragging={dragging}>
        <HotspotLine />
        <StyledPlusIcon onClick={this.clickHotspot}>
          <Icon name="B7" size="2rem" color={v.colors.teal} />
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
