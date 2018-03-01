import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

const StyledImage = styled.img`
  /* basic way to make it "responsive" */
  max-width: 100vw;
`

class ImageItem extends React.PureComponent {
  render() {
    const { item } = this.props
    const { url } = item.filestack_file
    return (
      <StyledImage src={url} alt={item.name} />
    )
  }
}

ImageItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ImageItem
