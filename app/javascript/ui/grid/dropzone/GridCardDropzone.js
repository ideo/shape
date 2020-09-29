import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
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

const StyledDisplayText = styled(DisplayText)`
  position: absolute;
  top: 50%;
  left: 25%;
`

const StyledGridCardDropzone = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${v.colors.primaryLight};
`
StyledGridCardDropzone.displayName = 'GridCardDropzone'

@observer
class GridCardDropzone extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const { exactDropSpot, didDrop, droppingFilesCount } = this.props

    const dropzoneText = didDrop
      ? `Uploading 0 of ${droppingFilesCount} files`
      : 'Drag & Drop'

    let inner = null

    if (didDrop && exactDropSpot) {
      inner = (
        <StyledDisplayText fontSize={'.75em'} textTransform="uppercase">
          {dropzoneText}
        </StyledDisplayText>
      )
    } else if (exactDropSpot) {
      inner = (
        <StyledIconAndHeadingHolder display={'inline-block'}>
          <CloudIcon />
          <DisplayText fontSize={'.75em'} textTransform="uppercase">
            {dropzoneText}
          </DisplayText>
        </StyledIconAndHeadingHolder>
      )
    }

    return (
      <StyledGridCardDropzone className={'gridCardDropzone'}>
        {inner}
      </StyledGridCardDropzone>
    )
  }
}

GridCardDropzone.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  row: PropTypes.number.isRequired,
  col: PropTypes.number.isRequired,
  exactDropSpot: PropTypes.bool.isRequired,
  didDrop: PropTypes.bool.isRequired,
  droppingFilesCount: PropTypes.number.isRequired,
}

GridCardDropzone.displayName = 'GridCardDropzone'

export default GridCardDropzone
