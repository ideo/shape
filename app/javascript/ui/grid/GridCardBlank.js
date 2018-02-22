import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import CollectionCard from '~/stores/jsonApi/CollectionCard'
import Icon from '~/ui/global/Icon'
import { StyledGridCard } from './GridCard'

const StyledGridCardBlank = StyledGridCard.extend`
  background: white;
  cursor: auto;

  button {
    cursor: pointer;
    border: none;
  }
`

const StyledGridCardInner = styled.div`
  padding: 2rem;
`

@inject('uiStore', 'apiStore')
@observer
class GridCardBlank extends React.Component {
  state = {
    creatingCollection: false,
    loading: false,
    inputText: '',
  }

  onTextChange = (e) => {
    this.setState({
      inputText: e.target.value
    })
  }

  startCreatingCollection = () => {
    this.setState({ creatingCollection: true })
  }

  createCollection = () => {
    const card = new CollectionCard({
      // NOTE: technically this uses the same order as the card it is going "next to"
      // but will be given order + 1 after reorderCards()
      order: this.props.order,
      width: 1,
      height: 1,
      // `parent` is the collection this card belgngs to
      parent_id: this.props.parent.id,
      // `collection` is the collection being created within the card
      collection_attributes: {
        name: this.state.inputText,
      }
    }, this.props.apiStore)

    this.setState({ loading: true }, () => {
      card.API_create().then(() => {
        // this will close the blank card so no need to set loading: false
        this.closeBlankContentTool()
      })
    })
  }

  closeBlankContentTool = () => {
    this.props.uiStore.closeBlankContentTool()
  }

  renderInner = () => {
    if (this.state.creatingCollection) {
      return (
        <div>
          <input
            placeholder="Collection name"
            value={this.state.inputText}
            onChange={this.onTextChange}
          />
          <input
            onClick={this.createCollection}
            type="submit"
            value="save"
            disabled={this.state.loading}
          />
        </div>
      )
    }
    return (
      <div>
        <button onClick={this.startCreatingCollection}>
          Add Collection
          &nbsp;
          <Icon name="squarePlus" size="2rem" />
        </button>
      </div>
    )
  }

  render() {
    return (
      <StyledGridCardBlank>
        <StyledGridCardInner>
          {this.renderInner()}
          <br />
          <br />
          <button onClick={this.closeBlankContentTool}>
            <Icon name="close_grey" size="2rem" />
          </button>
        </StyledGridCardInner>
      </StyledGridCardBlank>
    )
  }
}

GridCardBlank.propTypes = {
  order: PropTypes.number.isRequired,
  // parent is the parent collection
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
}
GridCardBlank.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

GridCardBlank.displayName = 'GridCardBlankHOC'

export default GridCardBlank
