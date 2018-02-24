import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

export const StyledImageItem = styled.div`
  background-image: url(${props => props.url});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  width: 100%;
  height: 100%;
`
StyledImageItem.displayName = 'StyledImageItem'

class ImageItem extends React.PureComponent {
  render() {
    const { item } = this.props
    const imageUrl = item.filestack_file.url

    return (
      <StyledImageItem url={imageUrl} />
    )
  }
}

ImageItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ImageItem
