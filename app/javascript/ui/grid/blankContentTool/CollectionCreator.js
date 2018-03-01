import PropTypes from 'prop-types'

import StyledCover from '~/ui/grid/covers/StyledCover'

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
      <StyledCover>
        <input
          placeholder="Collection name"
          value={this.state.inputText}
          onChange={this.onInputChange}
        />
        <input
          onClick={this.createCollection}
          type="submit"
          value="save"
          disabled={this.props.loading}
        />
      </StyledCover>
    )
  }
}

CollectionCreator.propTypes = {
  loading: PropTypes.bool.isRequired,
  createCard: PropTypes.func.isRequired,
}

export default CollectionCreator
