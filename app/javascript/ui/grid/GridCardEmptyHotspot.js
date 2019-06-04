import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'
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

@inject('uiStore')
@observer
class GridCardEmptyHotspot extends React.Component {
  onClickHotspot = () => {
    const { uiStore, card } = this.props
    const { order } = card
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
    return (
      <StyledGridCardEmpty onClick={this.onClickHotspot}>
        <StyledPlusIcon className="plus-icon">
          <PlusIcon />
        </StyledPlusIcon>
      </StyledGridCardEmpty>
    )
  }
}

GridCardEmptyHotspot.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
}
GridCardEmptyHotspot.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

GridCardEmptyHotspot.displayName = 'GridCardEmptyHotspot'

export default GridCardEmptyHotspot
