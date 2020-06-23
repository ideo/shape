import _ from 'lodash'
import PropTypes from 'prop-types'

import Button from '~/ui/global/Button'
import { BctTextField } from '~/ui/global/styled/forms'
import PaddedCardCover from '~/ui/grid/covers/PaddedCardCover'
import v, { KEYS } from '~/utils/variables'
import { routingStore, uiStore } from '~/stores'
import googleTagManager from '~/vendor/googleTagManager'

class CollectionCreator extends React.Component {
  state = {
    inputText: '',
  }

  onInputChange = e => {
    if (e.target.value.length > v.maxTitleLength) return
    this.setState({
      inputText: e.target.value,
    })
  }

  handleKeyDown = e => {
    if (e.keyCode === KEYS.ESC) {
      this.props.closeBlankContentTool()
    }
  }

  afterCreate = card => {
    googleTagManager.push({
      event: 'formSubmission',
      formType: `Create ${this.dbType || 'Collection'}`,
    })

    // if creating a submissionBox we route you to finish setting up the collection
    if (this.props.type === 'submissionBox')
      routingStore.routeTo('collections', card.record.id)
  }

  createCollection = e => {
    e.preventDefault()
    if (!this.state.inputText) return
    const { createCard, type } = this.props
    const cardParams = {
      // `collection` is the collection being created within the card
      collection_attributes: {
        name: this.state.inputText,
        master_template: this.shouldCreateAsSubTemplate,
        type: this.dbType,
        num_columns: this.numColumns,
      },
    }
    if (type === 'search')
      cardParams.collection_attributes.search_term = this.state.inputText

    createCard(cardParams, {
      afterCreate: this.afterCreate,
    })
  }

  get shouldCreateAsSubTemplate() {
    const { type } = this.props
    const { viewingCollection } = uiStore
    return type === 'template' || viewingCollection.isTemplate
  }

  get dbType() {
    const { type, parentIsFourWide } = this.props

    switch (type) {
      case 'submissionBox':
        return 'Collection::SubmissionBox'
        break
      case 'testCollection':
        return 'Collection::TestCollection'
        break
      case 'foamcoreBoard':
      case 'template':
        return 'Collection::Board'
        break
      case 'search':
        return 'Collection::SearchCollection'
        break
      case 'collection':
        if (parentIsFourWide) return 'Collection::Board'
        return null
    }
    return null
  }

  get numColumns() {
    const { type, parentIsFourWide } = this.props
    if (type === 'foamcoreBoard') {
      return 16
    } else if (
      type === 'template' ||
      (parentIsFourWide && type === 'collection')
    ) {
      return 4
    }
    return null
  }

  get typeName() {
    const { type } = this.props
    // e.g. 'submissionBox' -> 'Submission Box'
    return _.startCase(type)
  }

  render() {
    const { type } = this.props
    const placeholder =
      type === 'search'
        ? 'add search term for collection'
        : `${this.typeName} name`

    return (
      <PaddedCardCover>
        <form className="form" onSubmit={this.createCollection}>
          <BctTextField
            autoFocus
            data-cy="CollectionCreatorTextField"
            placeholder={placeholder}
            value={this.state.inputText}
            onChange={this.onInputChange}
            onKeyDown={this.handleKeyDown}
          />
          <Button
            data-cy="CollectionCreatorFormButton"
            disabled={this.props.loading}
            minWidth={125}
          >
            Create
          </Button>
        </form>
      </PaddedCardCover>
    )
  }
}

CollectionCreator.propTypes = {
  loading: PropTypes.bool.isRequired,
  type: PropTypes.oneOf([
    'collection',
    'template',
    'testCollection',
    'submissionBox',
    'foamcoreBoard',
    'search',
  ]),
  createCard: PropTypes.func.isRequired,
  closeBlankContentTool: PropTypes.func.isRequired,
  parentIsFourWide: PropTypes.bool,
}
CollectionCreator.defaultProps = {
  type: 'collection',
  parentIsFourWide: false,
}

export default CollectionCreator
