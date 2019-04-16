import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import { CloseButton } from '~/ui/global/styled/buttons'

const StyledImage = styled.img`
  /* Made it "responsive" and centered*/
  display: block;
  max-width: 100vw;
  max-height: 42vw;
  margin-right: auto;
  margin-left: auto;
  padding-top: 3%;

`
StyledImage.displayName = 'StyledImage'

class ImageItem extends React.PureComponent {
  render() {
    const { item, onCancel } = this.props
    return (
      <div>
        <CloseButton onClick={onCancel} />
        <StyledImage src={item.imageUrl()} alt={item.name} />
      </div>
    )
  }
}

ImageItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  onCancel: PropTypes.func.isRequired,
}

export default ImageItem
