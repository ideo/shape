import PropTypes from 'prop-types'

import PaddedCardCover from '~/ui/grid/covers/PaddedCardCover'
import { ITEM_TYPES, KEYS } from '~/utils/variables'
import MeasureSelect from '~/ui/reporting/MeasureSelect'

class DataItemCreator extends React.Component {
  handleKeyDown = e => {
    if (e.keyCode === KEYS.ESC) {
      this.props.closeBlankContentTool()
    }
  }

  createItem = value => {
    const { createCard } = this.props
    createCard({
      item_attributes: {
        type: ITEM_TYPES.DATA,
        name: 'Report',
        data_settings: {
          d_measure: value,
          d_timeframe: 'ever',
        },
      },
    })
  }

  render() {
    return (
      <PaddedCardCover>
        <form className="form">
          <MeasureSelect
            onSelect={this.createItem}
            dataSettingsName="measure"
          />
        </form>
      </PaddedCardCover>
    )
  }
}

DataItemCreator.propTypes = {
  createCard: PropTypes.func.isRequired,
  closeBlankContentTool: PropTypes.func.isRequired,
}

export default DataItemCreator
