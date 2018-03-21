import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

export const StyledImageCover = styled.div`
  background-image: url(${props => props.url});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  width: 100%;
  height: 100%;
`
StyledImageCover.displayName = 'StyledImageCover'

class ImageItemCover extends React.PureComponent {
  render() {
    const { item } = this.props
    const { filestack_file_url } = item
    return (
      <StyledImageCover url={filestack_file_url} />
    )
  }
}

ImageItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ImageItemCover
