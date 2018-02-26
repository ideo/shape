import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

export const StyledImageItem = styled.div`
  background-image: url(${props => props.url});
  background-size: ${props => props.backgroundSize};
  background-position: center;
  background-repeat: no-repeat;
  width: 100%;
  height: 100%;
`
StyledImageItem.displayName = 'StyledImageItem'

class ImageItem extends React.PureComponent {
  render() {
    const { item, backgroundSize } = this.props
    const { url } = item.filestack_file
    const styledProps = {
      backgroundSize,
      url
    }

    return (
      <StyledImageItem {...styledProps} />
    )
  }
}

ImageItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  backgroundSize: PropTypes.string,
}

ImageItem.defaultProps = {
  backgroundSize: 'cover',
}

export default ImageItem
