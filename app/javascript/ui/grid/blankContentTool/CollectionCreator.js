import PropTypes from 'prop-types'

import { BctTextField, FormButton } from '~/ui/global/styled/forms'
import PaddedCardCover from '~/ui/grid/covers/PaddedCardCover'
import { KEYS } from '~/utils/variables'

class CollectionCreator extends React.Component {
  state = {
    inputText: '',
  }

  onInputChange = (e) => {
    this.setState({
      inputText: e.target.value
    })
  }

  handleKeyDown = (e) => {
    if (e.keyCode === KEYS.ESC) {
      this.props.closeBlankContentTool()
    }
  }

  createCollection = (e) => {
    e.preventDefault()
    if (!this.state.inputText) return
    const { createCard, template } = this.props
    createCard({
      // `collection` is the collection being created within the card
      collection_attributes: {
        name: this.state.inputText,
        master_template: template,
      }
    })
  }

  render() {
    const { template } = this.props
    return (
      <PaddedCardCover>
        <form className="form" onSubmit={this.createCollection}>
          <BctTextField
            autoFocus
            placeholder={`${template ? 'Template' : 'Collection'} name`}
            value={this.state.inputText}
            onChange={this.onInputChange}
            onKeyDown={this.handleKeyDown}
          />
          <FormButton
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

CollectionCreator.propTypes = {
  loading: PropTypes.bool.isRequired,
  template: PropTypes.bool,
  createCard: PropTypes.func.isRequired,
  closeBlankContentTool: PropTypes.func.isRequired,
}
CollectionCreator.defaultProps = {
  template: false,
}

export default CollectionCreator
