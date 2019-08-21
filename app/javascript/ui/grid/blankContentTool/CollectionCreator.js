import _ from 'lodash'
import PropTypes from 'prop-types'

import { FormButton } from '~/ui/global/styled/buttons'
import { BctTextField } from '~/ui/global/styled/forms'
import PaddedCardCover from '~/ui/grid/covers/PaddedCardCover'
import v, { KEYS } from '~/utils/variables'
import { routingStore } from '~/stores'
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

    createCard(
      {
        // `collection` is the collection being created within the card
        collection_attributes: {
          name: this.state.inputText,
          master_template: type === 'template',
          type: this.dbType,
        },
      },
      {
        afterCreate: this.afterCreate,
      }
    )
  }

  get dbType() {
    const { type } = this.props
    let dbType = null

    if (type === 'submissionBox') dbType = 'Collection::SubmissionBox'
    else if (type === 'testCollection') dbType = 'Collection::TestCollection'
    else if (type === 'foamcoreBoard') dbType = 'Collection::Board'

    return dbType
  }

  get typeName() {
    const { type } = this.props
    // e.g. 'submissionBox' -> 'Submission Box'
    return _.startCase(type)
  }

  render() {
    return (
      <PaddedCardCover>
        <form className="form" onSubmit={this.createCollection}>
          <BctTextField
            autoFocus
            data-cy="CollectionCreatorTextField"
            placeholder={`${this.typeName} name`}
            value={this.state.inputText}
            onChange={this.onInputChange}
            onKeyDown={this.handleKeyDown}
          />
          <FormButton
            data-cy="CollectionCreatorFormButton"
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
  type: PropTypes.oneOf([
    'collection',
    'template',
    'testCollection',
    'submissionBox',
    'foamcoreBoard',
  ]),
  createCard: PropTypes.func.isRequired,
  closeBlankContentTool: PropTypes.func.isRequired,
}
CollectionCreator.defaultProps = {
  type: 'collection',
}

export default CollectionCreator
