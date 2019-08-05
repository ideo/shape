import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import CardActionHolder from '~/ui/icons/CardActionHolder'
import EditPencilIconLarge from '~/ui/icons/EditPencilIconLarge'

@observer
class CoverImageToggle extends React.Component {
  toggle = e => {
    const { card, onReassign } = this.props
    card.is_cover = !card.is_cover
    card.save()
    if (card.is_cover) onReassign()
  }

  render() {
    const { card } = this.props
    return (
      <CardActionHolder
        className="show-on-hover"
        active={card.is_cover}
        onClick={this.toggle}
        tooltipText={
          card.is_cover ? 'remove as cover image' : 'make cover image'
        }
        role="button"
      >
        <EditPencilIconLarge />
      </CardActionHolder>
    )
  }
}

CoverImageToggle.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  onReassign: PropTypes.func.isRequired,
}

export default CoverImageToggle
