import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import CardActionHolder from '~/ui/icons/CardActionHolder'
import ContainImageIcon from '~/ui/icons/ContainImageIcon'

class ContainImage extends React.Component {
  toggleSelected = ev => {
    ev.preventDefault()
    const { card } = this.props
    card.image_contain = !card.image_contain
    card.save()
  }

  render() {
    const { image_contain } = this.props

    return (
      <CardActionHolder
        className="show-on-hover"
        active={image_contain}
        onClick={this.toggleSelected}
        tooltipText={
          !image_contain ? 'show whole image' : 'fill tile with image'
        }
      >
        <ContainImageIcon />
      </CardActionHolder>
    )
  }
}

ContainImage.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  image_contain: PropTypes.bool.isRequired,
}

// to override the long 'injected-xxx' name
ContainImage.displayName = 'ContainImage'

export default ContainImage
