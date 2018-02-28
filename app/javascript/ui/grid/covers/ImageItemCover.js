import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

const StyledCover = styled.div`
  background-image: url(${props => props.url});
  background-size: ${props => props.backgroundSize};
  background-position: center;
  background-repeat: no-repeat;
  width: 100%;
  height: 100%;
`
StyledCover.displayName = 'StyledCover'

class ImageItemCover extends React.PureComponent {
  render() {
    const { item, backgroundSize } = this.props
    const { url } = item.filestack_file
    const styledProps = {
      backgroundSize,
      url
    }

    return (
      <StyledCover {...styledProps} />
    )
  }
}

ImageItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  backgroundSize: PropTypes.string,
}

ImageItemCover.defaultProps = {
  backgroundSize: 'cover',
}

export default ImageItemCover
