import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

export const StyledImageCover = styled.div`
  ${props => props.url && `background-image: url(${props.url});`}
  ${props => props.bgColor && `background-color: ${props.bgColor};`}
  background-size: ${props => (props.contain ? 'contain' : 'cover')};
  background-position: center;
  background-repeat: no-repeat;
  width: 100%;
  height: 100%;
`
StyledImageCover.displayName = 'StyledImageCover'

class ImageItemCover extends React.PureComponent {
  render() {
    const { contain, item } = this.props
    const retina = window.devicePixelRatio && window.devicePixelRatio > 1
    const imageUrl = item.imageUrl(retina ? 2400 : 1200)
    return <StyledImageCover url={imageUrl} contain={contain} />
  }
}

ImageItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  contain: PropTypes.bool,
}

ImageItemCover.defaultProps = {
  contain: false,
}

export default ImageItemCover
