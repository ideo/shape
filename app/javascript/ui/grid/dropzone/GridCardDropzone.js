import _ from 'lodash'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

import v from '~/utils/variables'
import { DisplayText } from '~/ui/global/styled/typography'
import CloudIcon from '~/ui/icons/CloudIcon'
import IconHolder from '~/ui/icons/IconHolder'

const StyledIconAndHeadingHolder = styled(IconHolder)`
  width: 45%;
  height: auto;
  position: absolute;
  top: 20%;
  left: 25%;
  color: ${v.colors.secondaryMedium};
  pointer-events: none;
  text-align: center;
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
  render() {
    const { fileDropProgress, showDropzoneIcon, uiStore } = this.props
    const { droppingFilesCount } = uiStore

    return (
      <StyledGridCardDropzone className={'gridCardDropzone'}>
        {showDropzoneIcon && (
          <StyledIconAndHeadingHolder display={'inline-block'}>
            <CloudIcon />
            <DisplayText fontSize={'.75em'} textTransform="uppercase">
              {_.isNumber(fileDropProgress)
                ? `Uploading ${droppingFilesCount} files`
                : 'Drag & Drop'}
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
  fileDropProgress: PropTypes.oneOfType([PropTypes.number, PropTypes.null])
    .isRequired,
}

GridCardDropzone.displayName = 'GridCardDropzone'

export default GridCardDropzone
