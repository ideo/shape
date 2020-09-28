import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

import v from '~/utils/variables'
import { DisplayText } from '~/ui/global/styled/typography'
import CloudIcon from '~/ui/icons/CloudIcon'
import IconHolder from '~/ui/icons/IconHolder'

const StyledIconAndHeadingHolder = styled(IconHolder)`
  width: 30%;
  height: auto;
  position: absolute;
  top: 20%;
  left: 35%;
  color: ${v.colors.secondaryMedium};
  pointer-events: none;
`

const StyledGridCardDropzone = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${v.colors.primaryLight};
`
StyledGridCardDropzone.displayName = 'GridCardDropzone'

@inject('uiStore', 'apiStore')
@observer
class GridCardDropzone extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const { showDropzoneIcon } = this.props

    return (
      <StyledGridCardDropzone
        className={'gridCardDropzone'}
        onDragOver={this.handleDragOver}
        onDragLeave={this.resetUpload}
      >
        {showDropzoneIcon && (
          <StyledIconAndHeadingHolder display={'inline-block'}>
            <CloudIcon />
            <DisplayText fontSize={'.75em'} textTransform="uppercase">
              Drag & Drop
            </DisplayText>
          </StyledIconAndHeadingHolder>
        )}
      </StyledGridCardDropzone>
    )
  }
}

GridCardDropzone.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

GridCardDropzone.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  row: PropTypes.number.isRequired,
  col: PropTypes.number.isRequired,
  showDropzoneIcon: PropTypes.bool.isRequired,
}

GridCardDropzone.displayName = 'GridCardDropzone'

export default GridCardDropzone
