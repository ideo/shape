import PropTypes from 'prop-types'

import { BctTextField, FormButton } from '~/ui/global/styled/forms'
import PaddedCardCover from '~/ui/grid/covers/PaddedCardCover'
import { ITEM_TYPES, KEYS } from '~/utils/variables'

class DataItemCreator extends React.Component {
  state = {
    inputText: '',
  }

  onInputChange = e => {
    this.setState({
      inputText: e.target.value,
    })
  }

  handleKeyDown = e => {
    if (e.keyCode === KEYS.ESC) {
      this.props.closeBlankContentTool()
    }
  }

  createItem = e => {
    e.preventDefault()
    if (!this.state.inputText) return
    const { inputText } = this.state
    const { createCard } = this.props
    createCard({
      item_attributes: {
        type: ITEM_TYPES.DATA,
        name: inputText,
      },
    })
  }

  render() {
    return (
      <PaddedCardCover>
        <form className="form" onSubmit={this.createItem}>
          <BctTextField
            autoFocus
            data-cy="DataItemCreatorTextField"
            placeholder="Report name"
            value={this.state.inputText}
            onChange={this.onInputChange}
            onKeyDown={this.handleKeyDown}
          />
          <FormButton
            data-cy="DataItemCreatorFormButton"
            disabled={this.props.loading}
            width={125}
          >
            Add
          </FormButton>
        </form>
      </PaddedCardCover>
    )
  }
}

DataItemCreator.propTypes = {
  loading: PropTypes.bool.isRequired,
  createCard: PropTypes.func.isRequired,
  closeBlankContentTool: PropTypes.func.isRequired,
}

export default DataItemCreator
