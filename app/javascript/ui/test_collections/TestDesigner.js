import _ from 'lodash'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import styled, { ThemeProvider } from 'styled-components'
import { Fragment } from 'react'
import FlipMove from 'react-flip-move'
import pluralize from 'pluralize'
import googleTagManager from '~/vendor/googleTagManager'

import { LargerH3 } from '~/ui/global/styled/typography'
import v, { ITEM_TYPES } from '~/utils/variables'
import InlineLoader from '~/ui/layout/InlineLoader'
import QuestionLeftSide, {
  LeftSideContainer,
} from '~/ui/test_collections/QuestionLeftSide'
import {
  TestQuestionHolder,
  styledTestTheme,
} from '~/ui/test_collections/shared'
import QuestionHotEdge from '~/ui/test_collections/QuestionHotEdge'
import TestQuestion from '~/ui/test_collections/TestQuestion'
import RadioControl from '~/ui/global/RadioControl'
import trackError from '~/utils/trackError'
import AudienceSettings from '~/ui/test_collections/AudienceSettings'
// NOTE: Always import these models after everything else, can lead to odd dependency!
import CollectionCard from '~/stores/jsonApi/CollectionCard'

const TestQuestionFlexWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 694px;

  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    width: 600px;
  }

  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    width: 100%;
  }
`

const SECTIONS = ['intro', 'ideas', 'outro']

const NUM_IDEAS_LIMIT = 6

const Section = styled.div`
  border-top: 1px solid ${v.colors.black};
  margin: 1.25rem 0 -1.25rem 0;
  padding-top: 0.5rem;
`
Section.displayName = 'StyledSection'

const sectionTitle = section => {
  if (section === 'ideas') return 'Idea(s)'
  return section
}

const OuterContainer = styled.div`
  display: flex;
  margin-bottom: 50px;

  .design-column {
    flex: 1 0 0;
  }

  .settings-column {
    flex: 1 0 0;
    margin-left: 30px;
    width: auto;
  }

  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    flex-direction: column-reverse;
    flex-wrap: wrap;

    .design-column {
      justify-content: center;
    }

    .settings-column {
      margin-left: 0px;
    }
  }
`

const EmptySectionHotEdgeWrapper = styled.div`
  background: ${props => props.theme.borderColorEditing};
  height: 48px;
  width: 354px;
  border-radius: 7px;
`

const userEditableQuestionType = questionType => {
  return ['media', 'question_media', 'question_description'].includes(
    questionType
  )
}

@inject('apiStore', 'uiStore')
@observer
class TestDesigner extends React.Component {
  constructor(props) {
    super(props)
    const { collection_to_test, collection_to_test_id } = props.collection
    const hasCollectionToTest = collection_to_test && collection_to_test_id
    this.seenEditWarningAt = null
    this.state = {
      testType: hasCollectionToTest ? 'collection' : 'media',
      collectionToTest: collection_to_test,
      currentIdeaCardIndex: 0,
    }
  }

  async componentDidMount() {
    if (this.state.collectionToTest) return
    // if none is set, we look up the parent to provide a default value
    const { collection, apiStore } = this.props
    // Load idea cards
    if (collection.ideasCollection) collection.ideasCollection.API_fetchCards()
    const { parent_id } = collection.parent_collection_card
    try {
      const res = await apiStore.fetch('collections', parent_id)
      // default setting to the parent collection
      this.setState({
        collectionToTest: res.data,
      })
    } catch (e) {
      trackError(e, {
        message: `Unable to load parent collection for Collection ${collection.id}`,
      })
    }
  }

  get showEditWarning() {
    if (!this.seenEditWarningAt) return true
    const oneHourAgo = Date.now() - 1000 * 60 * 60
    if (this.seenEditWarningAt < oneHourAgo) {
      this.seenEditWarningAt = null
      return true
    }
    return false
  }

  get numResponses() {
    const { collection } = this.props
    return collection.num_survey_responses
  }

  get cardsBySection() {
    const { collection } = this.props
    const sections = {}
    SECTIONS.forEach(section => (sections[section] = []))
    collection.sortedCards.forEach(card => {
      if (sections[card.section_type]) sections[card.section_type].push(card)
    })
    return sections
  }

  // This shows a dialog immediately
  confirmWithDialog = ({ prompt, onConfirm }) => {
    const { uiStore } = this.props
    return new Promise((resolve, reject) => {
      uiStore.confirm({
        prompt,
        confirmText: 'Continue',
        iconName: 'Alert',
        onConfirm: () => {
          resolve(true)
          onConfirm()
        },
        onCancel: () => {
          // Reset so they can confirm again if they'd like to edit
          this.seenEditWarningAt = null
          resolve(false)
        },
      })
    })
  }

  // This shows a dialog only if the collection is a template
  confirmEdit = action => {
    const { collection } = this.props
    // Return a promise that resolves true so editing can continue
    return new Promise((resolve, reject) => {
      resolve(true)
      collection.confirmEdit({
        onConfirm: () => action(),
      })
    })
  }

  // Make sure that any path through this function returns a promise
  confirmActionIfResponsesExist = ({ action, message, conditions = true }) => {
    const confirmableAction = () => this.confirmEdit(action)
    if (this.numResponses > 0 && conditions && this.showEditWarning) {
      this.seenEditWarningAt = new Date()
      return this.confirmWithDialog({
        prompt: `This test has ${pluralize(
          'response',
          this.numResponses,
          true
        )}. ${message}`,
        onConfirm: confirmableAction,
      })
    } else {
      return confirmableAction()
    }
  }

  onAddQuestionChoice = question => {
    question.API_createQuestionChoice({})
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
    const archiveCard = card => {
      card.API_archiveSelf({})
      if (card.card_question_type === 'question_idea') {
        const { currentIdeaCardIndex } = this.state
        this.handleSetCurrentIdeaCardIndex(currentIdeaCardIndex - 1)
      }
    }
    // Idea cards already have a different warning modal, and our system does
    // not support two confirm modals. We have to change how confirm modals work
    // to do both warnings, which might not be a good user exp anyway.
    if (card.card_question_type === 'question_idea') {
      archiveCard(card)
    } else {
      this.confirmActionIfResponsesExist({
        action: () => archiveCard(card),
        message: 'Are you sure you want to remove this question?',
      })
    }
  }

  handleNew = ({ card, sectionType, addBefore } = {}) => () => {
    this.confirmActionIfResponsesExist({
      action: () => {
        const order = addBefore ? card.order : card.order + 1
        const createdCard = this.createNewQuestionCard({ order, sectionType })
        if (createdCard) this.trackQuestionCreation()
      },
      message: 'Are you sure you want to add a new question?',
    })
  }

  handleSetCurrentIdeaCardIndex = index => {
    const { collection } = this.props
    const numIdeas = collection.ideasCollection
      ? collection.ideasCollection.sortedCards.length
      : 0
    if (index < 0 || index > numIdeas - 1) return
    this.setState({
      currentIdeaCardIndex: index,
    })
  }

  trackQuestionCreation = () => {
    googleTagManager.push({
      event: 'formSubmission',
      formType: `Create ${ITEM_TYPES.QUESTION}`,
    })
  }

  handleToggleShowMedia = e => {
    const { collection } = this.props
    this.confirmEdit(() => {
      collection.test_show_media = !collection.test_show_media
      if (collection.ideasCollection) {
        // simulate backend update that will happen in tandem
        collection.ideasCollection.test_show_media = collection.test_show_media
      }
      collection.save()
    })
  }

  handleTestTypeChange = e => {
    const { collection } = this.props
    const { collectionToTest } = this.state
    const { value } = e.target
    this.confirmEdit(async () => {
      this.setState({ testType: null }) // show inline loader
      if (value === 'media') {
        collection.collection_to_test_id = null
      } else if (collectionToTest) {
        collection.collection_to_test_id = collectionToTest.id
      } else {
        return
      }
      await collection.save()
      collection.API_fetchCards()
      this.setState({ testType: value })
    })
  }

  handleQuestionFocus = async () => {
    const { collection } = this.props
    if (!this.canEditQuestions) return false
    if (!collection.isLiveTest) return true
    const result = await this.confirmActionIfResponsesExist({
      action: () => {
        return true
      },
      message: 'Are you sure you want to edit this question?',
    })
    return result
  }

  get styledTheme() {
    if (this.state.testType === 'collection') {
      return styledTestTheme('secondary')
    }
    return styledTestTheme('primary')
  }

  get canEditQuestions() {
    // We allow content editors (e.g. template instance) to edit the question content
    // but not necessarily add or change the questions themselves
    return this.props.collection.can_edit_content
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

  get reachedNumIdeasLimit() {
    const { collection } = this.props
    if (!collection.ideasCollection) return false
    return collection.ideasCollection.collection_cards.length >= NUM_IDEAS_LIMIT
  }

  get canAddIdeas() {
    const { isTemplate, isDraftTest, ideasCollection } = this.props.collection
    return Boolean(
      this.canEditQuestions && !isTemplate && isDraftTest && ideasCollection
    )
  }

  // A method specifically designed for adding new idea cards
  // All other cards can be created using createNewQuestionCard
  createNewIdea = async ({ order }) => {
    const { uiStore, collection } = this.props
    if (this.reachedNumIdeasLimit) {
      uiStore.alert(
        `To ensure quality responses, a single test is limited to a maximum of ${NUM_IDEAS_LIMIT} ideas total. To evaluate more ideas, please create an additional test.`
      )
      return
    }
    const result = await this.confirmActionIfResponsesExist({
      action: () => {
        return true
      },
      message: 'Are you sure you want to add a new idea?',
    })
    if (!result) return

    return this.createNewQuestionCard({
      questionType: 'question_idea',
      sectionType: 'ideas',
      parentCollection: collection.ideasCollection,
      order,
    })
  }

  createNewQuestionCard = ({
    replacingCard,
    order,
    sectionType,
    questionType = '',
    parentCollection = null,
  }) => {
    const { collection, apiStore } = this.props
    const parent = parentCollection || collection
    let newSectionType = 'ideas'
    if (this.state.testType === 'media') {
      newSectionType = replacingCard ? replacingCard.section_type : sectionType
    }
    const attrs = {
      item_attributes: {
        type: ITEM_TYPES.QUESTION,
        question_type: questionType,
      },
      section_type: newSectionType,
      order: replacingCard ? replacingCard.order : order,
      parent_id: parent.id,
    }
    const card = new CollectionCard(attrs, apiStore)
    card.parent = parent
    if (replacingCard) {
      // Set new card in same place as that you are replacing
      card.order = replacingCard.order
      return card.API_replace({ replacingCard })
    } else {
      return card.API_create()
    }
  }

  renderHotEdge({
    card,
    sectionType,
    addBefore = false,
    lastCard = false,
  } = {}) {
    if (!this.canEdit) return
    let noCard = false
    if (card && !card.hasOwnProperty('id')) {
      noCard = true
    }

    return (
      <QuestionHotEdge
        noCard={noCard}
        lastCard={lastCard}
        onAdd={this.handleNew({ card, sectionType, addBefore })}
      />
    )
  }

  renderTestTypeForm() {
    const { collection } = this.props
    const canEdit = collection.can_edit
    const { collectionToTest, testType } = this.state
    // also searchvalue comes from collection_to_test.name.... or something

    const isDraft = collection.isDraftTest
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

  renderCard = (card, firstCard, lastCard, i, sectionType) => {
    const { collection } = this.props
    const { test_status } = collection
    const { currentIdeaCardIndex } = this.state
    let questionParent
    let questionCard
    if (card.card_question_type === 'ideas_collection') {
      questionParent = card.record
      questionCard = questionParent.sortedCards[currentIdeaCardIndex]
    } else {
      questionParent = collection
      questionCard = card
    }
    // Return if it tries to render idea card before they have been loaded
    // or if the card has no question_type assigned and is within a template instance
    if (!questionCard || (!this.canEdit && !card.card_question_type)) return
    const { record } = questionCard
    // Record is not present momentarily when turning an idea into a media item
    if (!record) return
    return (
      <Fragment>
        <QuestionLeftSide
          card={questionCard}
          canEdit={this.canEdit}
          handleSelectChange={this.handleSelectChange}
          handleTrash={this.handleTrash}
          canAddChoice={record.isCustomizableQuestionType}
          onAddChoice={this.onAddQuestionChoice}
          createNewQuestionCard={this.createNewQuestionCard}
          createNewIdea={this.createNewIdea}
          ideasCollection={collection.ideasCollection}
          showMedia={collection.test_show_media}
          handleToggleShowMedia={this.handleToggleShowMedia}
          handleSetCurrentIdeaCardIndex={this.handleSetCurrentIdeaCardIndex}
          currentIdeaCardIndex={currentIdeaCardIndex}
          canAddIdeas={this.canAddIdeas}
          onAddChoice={this.onAddQuestionChoice}
        />
        <TestQuestionHolder
          editing
          firstCard={firstCard}
          lastCard={lastCard}
          userEditable={userEditableQuestionType(record.card_question_type)}
        >
          {i === 0 &&
            this.renderHotEdge({ card, sectionType, addBefore: true })}
          <TestQuestion
            editing
            parent={questionParent}
            card={questionCard}
            order={questionCard.order}
            handleFocus={this.handleQuestionFocus}
            canEdit={this.canEditQuestions}
            question_choices={record.question_choices}
            testStatus={test_status}
          />
          {card.card_question_type !== 'question_finish' &&
            this.renderHotEdge({ card, sectionType, lastCard })}
        </TestQuestionHolder>
      </Fragment>
    )
  }

  renderCards(cards, sectionType = null) {
    return cards.map((card, i) => {
      let firstCard = false
      let lastCard = false
      if (!card.record) return null
      const cardCount = cards.length
      if (i === 0) firstCard = true
      if (i === cardCount - 1) lastCard = true
      return (
        <FlipMove appearAnimation="fade" key={card.id}>
          <TestQuestionFlexWrapper className={`card ${card.id}`}>
            {this.renderCard(card, firstCard, lastCard, i, sectionType)}
          </TestQuestionFlexWrapper>
        </FlipMove>
      )
    })
  }

  renderSections() {
    return _.map(this.cardsBySection, (cards, sectionType) => (
      <Fragment key={`section-${sectionType}`}>
        <Section>
          <LargerH3 data-cy="section-title">
            {sectionTitle(sectionType)}
          </LargerH3>
        </Section>
        {cards.length === 0 && (
          <TestQuestionFlexWrapper>
            <LeftSideContainer></LeftSideContainer>
            <EmptySectionHotEdgeWrapper>
              {this.renderHotEdge({
                card: { order: 0 },
                sectionType,
                addBefore: true,
              })}
            </EmptySectionHotEdgeWrapper>
          </TestQuestionFlexWrapper>
        )}
        {this.renderCards(cards, sectionType)}
      </Fragment>
    ))
  }

  renderQuestions() {
    const { collection } = this.props
    return this.renderCards(collection.sortedCards)
  }

  renderTestType() {
    const { testType } = this.state

    if (testType === 'media') {
      return this.renderSections()
    } else if (testType === 'collection') {
      return this.renderQuestions()
    }

    return <InlineLoader />
  }

  render() {
    const { collection, apiStore } = this.props
    return (
      <ThemeProvider theme={this.styledTheme}>
        <OuterContainer>
          <div className={'design-column'}>
            <LargerH3>Feedback Design</LargerH3>
            {this.renderTestType()}
          </div>
          <div className={'settings-column'}>
            <LargerH3>Feedback Settings</LargerH3>
            {this.renderTestTypeForm()}
            {apiStore.currentUser && (
              <AudienceSettings
                testCollection={collection}
                submissionBox={collection.parent_submission_box}
              />
            )}
          </div>
        </OuterContainer>
      </ThemeProvider>
    )
  }
}
TestDesigner.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}
TestDesigner.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default TestDesigner
