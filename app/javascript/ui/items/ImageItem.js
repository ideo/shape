import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

const StyledImage = styled.img`
  /* basic way to make it "responsive" */
  max-width: 100vw;
`
StyledImage.displayName = 'StyledImage'

class ImageItem extends React.PureComponent {
  render() {
    const { item } = this.props
    const { filestack_file_url } = item
    return (
      <StyledImage src={filestack_file_url} alt={item.name} />
    )
  }
}

ImageItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ImageItem
