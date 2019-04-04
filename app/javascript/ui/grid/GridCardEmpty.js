import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'
import { CloseButton } from '~/ui/global/styled/buttons'
import GridCardHotspot from '~/ui/grid/GridCardHotspot'
import HotspotHelperGraphic from '~/ui/icons/HotspotHelperGraphic'

const StyledGridCardEmpty = styled.div`
  width: 100%;
  height: 100%;
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
  get showHelper() {
    const { uiStore, apiStore } = this.props
    if (uiStore.blankContentToolIsOpen) {
      return false
    }
    return apiStore.currentUser.show_helper
  }

  hideHelper = () => {
    const { apiStore } = this.props
    apiStore.currentUser.API_hideHelper()
  }

  render() {
    const { card, dragging, showHotspot, showHotEdge } = this.props

    return (
      <StyledGridCardEmpty>
        {showHotspot && (
          <GridCardHotspot
            card={card}
            dragging={dragging}
            position="left"
            showHotEdge={showHotEdge}
          />
        )}
        {this.showHelper && (
          <StyledHotspotHelper>
            <HotspotHelperGraphic />
            <CloseButton onClick={this.hideHelper} />
          </StyledHotspotHelper>
        )}
      </StyledGridCardEmpty>
    )
  }
}

GridCardEmpty.defaultProps = {
  showHotEdge: true,
}
GridCardEmpty.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  dragging: PropTypes.bool.isRequired,
  showHotspot: PropTypes.bool.isRequired,
  showHotEdge: PropTypes.bool,
}
GridCardEmpty.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

GridCardEmpty.displayName = 'GridCardEmpty'

export default GridCardEmpty
