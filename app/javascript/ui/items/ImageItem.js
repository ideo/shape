// import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

class ImageItem extends React.PureComponent {
  render() {
    const { item } = this.props
    const { url } = item.filestack_file
    return (
      <img src={url} alt={item.name} />
    )
  }
}

ImageItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default ImageItem
