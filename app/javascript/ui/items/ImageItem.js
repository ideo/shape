import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import { CloseButton } from '~/ui/global/styled/buttons'

const StyledImage = styled.img`
  /* basic way to make it "responsive" */
  max-width: 100vw;
`
StyledImage.displayName = 'StyledImage'

class ImageItem extends React.PureComponent {
  render() {
    const { item, onCancel } = this.props
    const { filestack_file_url } = item
    return (
      <div>
        <CloseButton onClick={onCancel} />
        <StyledImage src={filestack_file_url} alt={item.name} />
      </div>
    )
  }
}

ImageItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  onCancel: PropTypes.func.isRequired,
}

export default ImageItem
