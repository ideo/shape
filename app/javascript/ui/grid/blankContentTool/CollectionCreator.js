import PropTypes from 'prop-types'

import { TextField, FormButton } from '~/ui/global/styled/forms'
import PaddedCardCover from '~/ui/grid/covers/PaddedCardCover'

class CollectionCreator extends React.Component {
  state = {
    inputText: '',
  }

  onInputChange = (e) => {
    this.setState({
      inputText: e.target.value
    })
  }

  createCollection = () => {
    this.props.createCard({
      // `collection` is the collection being created within the card
      collection_attributes: {
        name: this.state.inputText,
      }
    })
  }

  render() {
    return (
      <PaddedCardCover>
        <div className="form">
          <TextField
            placeholder="Collection name"
            value={this.state.inputText}
            onChange={this.onInputChange}
          />
          <FormButton
            onClick={this.createCollection}
            disabled={this.props.loading}
            width={125}
          >
            Add
          </FormButton>
        </div>
      </PaddedCardCover>
    )
  }
}

CollectionCreator.propTypes = {
  loading: PropTypes.bool.isRequired,
  createCard: PropTypes.func.isRequired,
}

export default CollectionCreator
