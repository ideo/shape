import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'
import { CloseButton } from '~/ui/global/styled/buttons'
import GridCardHotspot from '~/ui/grid/GridCardHotspot'
import HotspotHelperGraphic from '~/ui/icons/HotspotHelperGraphic'
import PlusIcon from '~/ui/icons/PlusIcon'
import { StyledPlusIcon } from '~/ui/grid/FoamcoreGrid'

const StyledGridCardEmpty = styled.div`
  width: 100%;
  height: 100%;
  position: relative;

   &:hover {
    background-color: ${v.colors.primaryLight} !important;
    .plus-icon {
      display: block;
    }
  }
  .plus-icon {
    display: none;
  }
`

const StyledHotspotHelper = styled.div`
  padding-top: 2rem;
  padding-left: 0.5rem;

  svg {
    transition: ${v.transitionWithDelay};
    width: 90%;
    @media only screen and (min-width: ${v.responsive
        .medBreakpoint}px) and (max-width: ${v.responsive.largeBreakpoint}px) {
      width: 95%;
    }
  }
`

@inject('apiStore', 'uiStore')
@observer
class GridCardEmpty extends React.Component {
  onClickHotspot = () => {
    const { uiStore, card, position } = this.props
    const order = card.order
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

  render() {
    const { card, dragging, showHotspot, showHotEdge } = this.props
    return (
      <StyledGridCardEmpty onClick={this.onClickHotspot}>
        {showHotspot && (
          <GridCardHotspot
            card={card}
            dragging={dragging}
            position="left"
            showHotEdge={showHotEdge}
          />
        )}
        <StyledPlusIcon className="plus-icon">
          <PlusIcon />
        </StyledPlusIcon>
      </StyledGridCardEmpty>
    )
  }
}

GridCardEmpty.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  dragging: PropTypes.bool.isRequired,
  showHotspot: PropTypes.bool.isRequired,
  showHotEdge: PropTypes.bool.isRequired,
}
GridCardEmpty.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

GridCardEmpty.displayName = 'GridCardEmpty'

export default GridCardEmpty
