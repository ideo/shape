import _ from 'lodash'
import { Flex } from 'reflexbox'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled, { ThemeProvider } from 'styled-components'
import FlipMove from 'react-flip-move'
import pluralize from 'pluralize'

import v, { ITEM_TYPES } from '~/utils/variables'
import QuestionSelectHolder from '~/ui/test_collections/QuestionSelectHolder'
import {
  TestQuestionHolder,
  styledTestTheme,
} from '~/ui/test_collections/shared'
import QuestionHotEdge from '~/ui/test_collections/QuestionHotEdge'
import TestQuestion from '~/ui/test_collections/TestQuestion'
import RadioControl from '~/ui/global/RadioControl'
import { apiStore } from '~/stores'
import AudienceSettings from '~/ui/test_collections/AudienceSettings'
// NOTE: Always import these models after everything else, can lead to odd dependency!
import CollectionCard from '~/stores/jsonApi/CollectionCard'

@observer
class TestDesigner extends React.Component {
  constructor(props) {
    super(props)
    const { collection_to_test, collection_to_test_id } = props.collection
    const hasCollectionToTest = collection_to_test && collection_to_test_id
    this.state = {
      testType: hasCollectionToTest ? 'collection' : 'media',
      collectionToTest: collection_to_test,
    }
  }

  async componentDidMount() {
    if (this.state.collectionToTest) return
    // if none is set, we look up the parent to provide a default value
    const { collection } = this.props
    const { parent_id } = collection.parent_collection_card
    try {
      const res = await collection.apiStore.fetch('collections', parent_id)
      // default setting to the parent collection
      this.setState({
        collectionToTest: res.data,
      })
    } catch (e) {
      console.warn(e, 'unable to load parent collection')
    }
  }

  get numResponses() {
    const { collection } = this.props
    return collection.num_survey_responses
  }

  // This shows a dialog immediately
  confirmWithDialog = ({ prompt, onConfirm }) => {
    const { collection } = this.props
    collection.apiStore.uiStore.confirm({
      prompt,
      confirmText: 'Continue',
      iconName: 'Alert',
      onConfirm: () => onConfirm(),
    })
  }

  // This shows a dialog only if the collection is a template
  confirmEdit = action => {
    const { collection } = this.props
    collection.confirmEdit({
      onConfirm: () => action(),
    })
  }

  confirmActionIfResponsesExist = ({ action, message, conditions = true }) => {
    const confirmableAction = () => this.confirmEdit(action)
    if (this.numResponses > 0 && conditions) {
      this.confirmWithDialog({
        prompt: `This test has ${pluralize(
          'response',
          this.numResponses,
          true
        )}. ${message}`,
        onConfirm: confirmableAction,
      })
    } else {
      confirmableAction()
    }
  }

  handleSelectChange = replacingCard => ev => {
    // If test is already launched, and this isn't a blank card,
    // confirm they want to change the type
    this.confirmActionIfResponsesExist({
      action: () => {
        this.createNewQuestionCard({
          replacingCard,
          questionType: ev.target.value,
        })
      },
      message: 'Are you sure you want to change the question type?',
      conditions: replacingCard.card_question_type,
    })
  }

  handleTrash = card => {
    this.confirmActionIfResponsesExist({
      action: () => card.API_archiveSelf({}),
      message: 'Are you sure you want to remove this question?',
    })
  }

  handleNew = (card, addBefore) => () => {
    this.confirmActionIfResponsesExist({
      action: () => {
        const order = addBefore ? card.order - 0.5 : card.order + 1
        this.createNewQuestionCard({ order })
      },
      message: 'Are you sure you want to add a new question?',
    })
  }

  archiveMediaCardsIfDefaultState() {
    const { sortedCards } = this.props.collection
    const [first, second, third] = sortedCards
    // basic check to see if we are (roughly) in the default state
    const defaultState =
      first &&
      second &&
      third &&
      first.card_question_type === 'question_media' &&
      second.card_question_type === 'question_description' &&
      third.card_question_type === 'question_useful' &&
      sortedCards.length === 4
    if (!defaultState) return false
    // archive the media and description card when switching to testType -> collection
    return first.API_archiveCards(_.map([first, second], 'id'))
  }

  handleTestTypeChange = e => {
    const { collection } = this.props
    const { collectionToTest } = this.state
    const { value } = e.target
    this.confirmEdit(async () => {
      this.setState({ testType: value })
      if (value === 'media') {
        collection.collection_to_test_id = null
      } else if (collectionToTest) {
        await this.archiveMediaCardsIfDefaultState()
        collection.collection_to_test_id = collectionToTest.id
      } else {
        return
      }
      collection.save()
    })
  }

  get styledTheme() {
    if (this.state.testType === 'collection') {
      return styledTestTheme('secondary')
    }
    return styledTestTheme('primary')
  }

  get canEditQuestions() {
    const {
      isTemplated,
      can_edit_content,
      test_status,
      launchable,
    } = this.props.collection
    // We allow content editors (e.g. template instance) to edit the question content
    // but not necessarily add or change the questions themselves, once the editor "launches"
    if (isTemplated)
      return can_edit_content && (test_status !== 'draft' || launchable)
    return can_edit_content
  }

  get canEdit() {
    // viewers still see the select forms, but disabled
    const { isTemplated, can_edit_content } = this.props.collection
    // If this is a template instance, don't allow editing
    // NOTE: if we ever allow template instance editors to add their own questions at the end
    // (before the finish card?) then we may want to individually check canEdit on a per card basis
    if (isTemplated) return false
    return can_edit_content
  }

  createNewQuestionCard = async ({
    replacingCard,
    order,
    questionType = '',
  }) => {
    const { collection } = this.props
    const attrs = {
      item_attributes: {
        type: ITEM_TYPES.QUESTION,
        question_type: questionType,
      },
      order: replacingCard ? replacingCard.order : order,
      parent_id: collection.id,
    }
    const card = new CollectionCard(attrs, apiStore)
    card.parent = collection
    if (replacingCard) {
      // Set new card in same place as that you are replacing
      card.order = replacingCard.order
      await replacingCard.API_archiveSelf({})
    }
    return card.API_create()
  }

  renderHotEdge(card, addBefore = false) {
    return <QuestionHotEdge onAdd={this.handleNew(card, addBefore)} />
  }

  renderTestTypeForm() {
    const { collection } = this.props
    const canEdit = collection.can_edit
    const { collectionToTest, testType } = this.state
    // also searchvalue comes from collection_to_test.name.... or something

    const isDraft = collection.test_status === 'draft'
    let options = [
      {
        value: 'media',
        label: 'Get feedback on an image, video or idea description',
        disabled: !isDraft || !canEdit,
      },
      {
        value: 'collection',
        label: (
          <div>
            Get feedback on collection:{' '}
            <span style={{ fontWeight: v.weights.medium }}>
              {collectionToTest && collectionToTest.name}
            </span>
          </div>
        ),
        disabled:
          !isDraft ||
          !canEdit ||
          (collectionToTest && !collectionToTest.isNormalCollection),
      },
    ]

    if (!isDraft || !canEdit) {
      options = _.filter(options, { value: testType })
    }

    return (
      // maxWidth mainly to force the radio buttons from spanning the page
      <form style={{ maxWidth: '750px' }}>
        <RadioControl
          options={options}
          name="test_type"
          onChange={this.handleTestTypeChange}
          selectedValue={testType}
        />
      </form>
    )
  }

  render() {
    const { collection } = this.props
    const cardCount = collection.sortedCards.length
    const inner = collection.sortedCards.map((card, i) => {
      let position
      const item = card.record
      // blank item can occur briefly while the placeholder card/item is being replaced
      if (!item) return null
      if (i === 0) position = 'question_beginning'
      if (i === cardCount - 1) position = 'question_end'
      const userEditable = [
        'media',
        'question_media',
        'question_description',
      ].includes(item.question_type)
      return (
        <FlipMove appearAnimation="fade" key={card.id}>
          <TestQuestionFlexWrapper className={`card ${card.id}`}>
            {i === 0 && this.canEdit && this.renderHotEdge(card, true)}
            <QuestionSelectHolder
              card={card}
              canEdit={this.canEdit}
              handleSelectChange={this.handleSelectChange}
              handleTrash={this.handleTrash}
            />
            <TestQuestionHolder editing userEditable={userEditable}>
              <TestQuestion
                editing
                parent={collection}
                card={card}
                item={item}
                position={position}
                order={card.order}
                canEdit={this.canEditQuestions}
              />
            </TestQuestionHolder>
            {this.canEdit &&
              card.card_question_type !== 'question_finish' &&
              this.renderHotEdge(card)}
          </TestQuestionFlexWrapper>
        </FlipMove>
      )
    })

    return (
      <ThemeProvider theme={this.styledTheme}>
        <OuterContainer>
          <div className={'col-start'}>
            <h3>Feedback Design</h3>
            <TopBorder />
            {inner}
            <BottomBorder />
          </div>
          <div className={'col-end'}>
            <h3>Feedback Settings</h3>
            {this.renderTestTypeForm()}
            <AudienceSettings />
          </div>
        </OuterContainer>
      </ThemeProvider>
    )
  }
}

// Todo: have first and last TestQuestionFlexWrapper replace BottomBorder/TopBorder
const TopBorder = styled.div`
  background-color: ${props => props.theme.borderColorEditing};
  border-radius: 7px 7px 0 0;
  height: 16px;
  margin-left: 314px;
  width: 374px;

  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    display: none;
  }
`
const BottomBorder = TopBorder.extend`
  border-radius: 0 0 7px 7px;
`

const TestQuestionFlexWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 694px;

  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    width: 600px;
  }

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    width: auto;
  }
`

const OuterContainer = styled.div`
  display: flex;

  .col-start {
    flex: 1;
  }

  .col-end {
    flex: 1;
    margin-left: 30px;
  }

  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    flex-direction: column-reverse;
    flex-wrap: wrap;

    .col-start {
      justify-content: center;
    }

    .col-end {
      margin-left: 0px;
    }
  }
`

TestDesigner.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default TestDesigner
