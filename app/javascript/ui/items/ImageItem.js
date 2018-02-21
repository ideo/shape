import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

export const StyledImageItem = styled.div`
  img {
    display: block;
    width: 100%;
  }
`
StyledImageItem.displayName = 'StyledImageItem'

class ImageItem extends React.Component {
  render() {
    const { item } = this.props
    const imageUrl = item.filestack_file.url

    return (
      <StyledImageItem>
        <img src={imageUrl} alt={item.name} />
      </StyledImageItem>
    )
  }
}

ImageItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ImageItem
