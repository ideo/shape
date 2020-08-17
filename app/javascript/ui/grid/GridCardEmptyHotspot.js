import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'
import PlusIcon from '~/ui/icons/PlusIcon'
import CloudIcon from '~/ui/icons/CloudIcon'
import { StyledPlusIcon } from '~/ui/grid/FoamcoreGrid'
import { Heading2 } from '~/ui/global/styled/typography'

const StyledDropzoneHolder = styled.div`
  position: absolute;
  height: 20%;
  top: 38%;
  left: 28%;
  color: ${v.colors.secondaryMedium};
`

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
    .cloud-icon {
      display: block;
    }
  }
  .plus-icon,
  .cloud-icon {
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

  get renderGridCardEmpty() {
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

  get renderGridCardDropzone() {
    const { visible } = this.props
    return (
      <StyledGridCardEmpty className={visible ? 'visible' : ''}>
        <StyledDropzoneHolder className="cloud-icon">
          <CloudIcon />
          <Heading2 fontSize={'1em'}>Drag & Drop</Heading2>
        </StyledDropzoneHolder>
      </StyledGridCardEmpty>
    )
  }

  render() {
    const { uploading } = this.props
    return uploading ? this.renderGridCardDropzone : this.renderGridCardEmpty
  }
}

GridCardEmptyHotspot.propTypes = {
  visible: PropTypes.bool,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  uploading: PropTypes.bool,
}
GridCardEmptyHotspot.defaultProps = {
  visible: false,
  uploading: false,
}
GridCardEmptyHotspot.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

GridCardEmptyHotspot.displayName = 'GridCardEmptyHotspot'

export default GridCardEmptyHotspot
