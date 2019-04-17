import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import { CloseButton } from '~/ui/global/styled/buttons'

const StyledImage = styled.img`
  display: block;
  /* basic way to make it "responsive" and centered */
  max-width: 100vw;
  margin-right: auto;
  margin-left: auto;
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
