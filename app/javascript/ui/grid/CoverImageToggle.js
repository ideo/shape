import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import CardActionHolder from '~/ui/icons/CardActionHolder'
import CoverImageToggleIcon from '~/ui/icons/CoverImageToggleIcon'
import v from '~/utils/variables'

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
        color={card.is_cover ? v.colors.black : v.colors.commonMedium}
        onClick={this.toggle}
        tooltipText={
          card.is_cover ? 'remove as cover image' : 'make cover image'
        }
        role="button"
      >
        <CoverImageToggleIcon />
      </CardActionHolder>
    )
  }
}

CoverImageToggle.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  onReassign: PropTypes.func.isRequired,
}

export default CoverImageToggle
