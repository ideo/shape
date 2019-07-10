import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'
import PlusIcon from '~/ui/icons/PlusIcon'
import { StyledPlusIcon } from '~/ui/grid/FoamcoreGrid'

const StyledGridCardEmpty = styled.div`
  width: 100%;
  height: 100%;
  position: relative;

  &.visible,
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
  openBlankContentTool = () => {
    const { uiStore, card } = this.props
    const { order, position } = card
    uiStore.openBlankContentTool({
      order,
      col: position.x,
      row: position.y,
    })
  }

  onClickHotspot = () => {
    const { card } = this.props
    const collection = card.parentCollection

    // confirmEdit will check if we're in a template and need to confirm changes
    if (collection) {
      collection.confirmEdit({
        onConfirm: () => this.openBlankContentTool(),
      })
      return
    }
    this.openBlankContentTool()
  }

  render() {
    const { visible } = this.props

    return (
      <StyledGridCardEmpty
        className={visible ? 'visible' : ''}
        onClick={this.onClickHotspot}
      >
        <StyledPlusIcon className="plus-icon">
          <PlusIcon />
        </StyledPlusIcon>
      </StyledGridCardEmpty>
    )
  }
}

GridCardEmptyHotspot.propTypes = {
  visible: PropTypes.bool,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
}
GridCardEmptyHotspot.defaultProps = {
  visible: false,
}
GridCardEmptyHotspot.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

GridCardEmptyHotspot.displayName = 'GridCardEmptyHotspot'

export default GridCardEmptyHotspot
