import _ from 'lodash'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled, { ThemeProvider } from 'styled-components'
import { Fragment } from 'react'
import FlipMove from 'react-flip-move'
import pluralize from 'pluralize'
import googleTagManager from '~/vendor/googleTagManager'

import { LargerH3 } from '~/ui/global/styled/typography'
import v, { ITEM_TYPES } from '~/utils/variables'
import QuestionLeftSide from '~/ui/test_collections/QuestionLeftSide'
import {
  TestQuestionHolder,
  styledTestTheme,
} from '~/ui/test_collections/shared'
import QuestionHotEdge from '~/ui/test_collections/QuestionHotEdge'
import TestQuestion from '~/ui/test_collections/TestQuestion'
import RadioControl from '~/ui/global/RadioControl'
import trackError from '~/utils/trackError'
import { apiStore } from '~/stores'
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

const userEditableQuestionType = questionType => {
  return ['media', 'question_media', 'question_description'].includes(
    questionType
  )
}

@observer
class TestDesigner extends React.Component {
  constructor(props) {
    super(props)
    const { collection_to_test, collection_to_test_id } = props.collection
    const hasCollectionToTest = collection_to_test && collection_to_test_id
    this.state = {
      testType: hasCollectionToTest ? 'collection' : 'media',
      collectionToTest: collection_to_test,
      currentIdeaCardIndex: 0,
    }
  }

  async componentDidMount() {
    // Load idea cards
    if (this.ideasCollection) this.ideasCollection.API_fetchCards()

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
      trackError(e, {
        message: `Unable to load parent collection for Collection ${collection.id}`,
      })
    }
  }

  get numResponses() {
    const { collection } = this.props
    return collection.num_survey_responses
  }

  get ideasCollection() {
    const { collection } = this.props
    const card = collection.sortedCards.find(
      card => card.card_question_type === 'ideas_collection'
    )
    if (card) return card.record
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
    const archiveCard = card => {
      card.API_archiveSelf({})
      if (card.card_question_type === 'question_idea') {
        const { currentIdeaCardIndex } = this.state
        this.handleSetCurrentIdeaCardIndex(currentIdeaCardIndex - 1)
      }
    }
    this.confirmActionIfResponsesExist({
      action: () => archiveCard(card),
      message: 'Are you sure you want to remove this question?',
    })
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
    const numIdeas = this.ideasCollection
      ? this.ideasCollection.sortedCards.length
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
      collection.save()
    })
  }

  handleTestTypeChange = async e => {
    const { collection } = this.props
    const { collectionToTest } = this.state
    const { value } = e.target
    this.confirmEdit(async () => {
      this.setState({ testType: value })
      if (value === 'media') {
        collection.collection_to_test_id = null
      } else if (collectionToTest) {
        collection.collection_to_test_id = collectionToTest.id
      } else {
        return
      }
      await collection.save()
      collection.API_fetchCards()
    })
  }

  get styledTheme() {
    if (this.state.testType === 'collection') {
      return styledTestTheme('secondary')
    }
    return styledTestTheme('primary')
  }

  get locked() {
    const { collection } = this.props
    return collection.is_test_locked
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
    // this is where we do allow editing if it's locked/purchased
    return can_edit_content
  }

  get canEdit() {
    // viewers still see the select forms, but disabled
    const { isTemplated, can_edit_content } = this.props.collection
    // If this is a template instance, don't allow editing
    // NOTE: if we ever allow template instance editors to add their own questions at the end
    // (before the finish card?) then we may want to individually check canEdit on a per card basis
    if (isTemplated) return false
    return can_edit_content && !this.locked
  }

  createNewQuestionCard = async ({
    replacingCard,
    order,
    sectionType,
    questionType = '',
    parentCollection = null,
  }) => {
    const { collection } = this.props
    const parent = parentCollection ? parentCollection : collection
    const attrs = {
      item_attributes: {
        type: ITEM_TYPES.QUESTION,
        question_type: questionType,
      },
      section_type: replacingCard ? replacingCard.section_type : sectionType,
      order: replacingCard ? replacingCard.order : order,
      parent_id: parent.id,
    }
    const card = new CollectionCard(attrs, apiStore)
    card.parent = parent
    if (replacingCard) {
      // Set new card in same place as that you are replacing
      card.order = replacingCard.order
      await replacingCard.API_archiveSelf({})
    }
    return card.API_create()
  }

  renderHotEdge({
    card,
    sectionType,
    addBefore = false,
    lastCard = false,
  } = {}) {
    if (!this.canEdit) return
    return (
      <QuestionHotEdge
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

  renderCard = (card, firstCard, lastCard) => {
    const { collection } = this.props
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
    if (!questionCard) return
    const { record } = questionCard
    // Record is not present momentarily when turning an idea into a media item
    if (!record) return
    return (
      <Fragment>
        <QuestionLeftSide
          card={questionCard}
          cardNumber={card.order + 1}
          canEdit={this.canEdit}
          handleSelectChange={this.handleSelectChange}
          handleTrash={this.handleTrash}
          createNewQuestionCard={this.createNewQuestionCard}
          ideasCollection={this.ideasCollection}
          showMedia={collection.test_show_media}
          handleToggleShowMedia={this.handleToggleShowMedia}
          handleSetCurrentIdeaCardIndex={this.handleSetCurrentIdeaCardIndex}
          currentIdeaCardIndex={currentIdeaCardIndex}
        />
        <TestQuestionHolder
          editing
          firstCard={firstCard}
          lastCard={lastCard}
          userEditable={userEditableQuestionType(record.card_question_type)}
        >
          <TestQuestion
            editing
            hideMedia={!collection.test_show_media}
            parent={questionParent}
            card={questionCard}
            order={questionCard.order}
            canEdit={this.canEditQuestions}
          />
        </TestQuestionHolder>
      </Fragment>
    )
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
          <TestQuestionFlexWrapper className="card">
            {this.renderHotEdge({
              card: { order: 0 },
              sectionType,
              addBefore: true,
            })}
          </TestQuestionFlexWrapper>
        )}
        {cards.map((card, i) => {
          // blank item can occur briefly while the placeholder card/item is being replaced
          let firstCard = false
          let lastCard = false
          if (!card.record) return null
          const cardCount = cards.length
          if (i === 0) firstCard = true
          if (i === cardCount - 1) lastCard = true
          return (
            <FlipMove appearAnimation="fade" key={card.id}>
              <TestQuestionFlexWrapper className={`card ${card.id}`}>
                {i === 0 &&
                  this.renderHotEdge({ card, sectionType, addBefore: true })}
                {this.renderCard(card, firstCard, lastCard)}
                {card.card_question_type !== 'question_finish' &&
                  this.renderHotEdge({ card, sectionType, lastCard })}
              </TestQuestionFlexWrapper>
            </FlipMove>
          )
        })}
      </Fragment>
    ))
  }

  render() {
    const { collection } = this.props
    return (
      <ThemeProvider theme={this.styledTheme}>
        <OuterContainer>
          <div className={'design-column'}>
            <LargerH3>Feedback Design</LargerH3>
            {this.renderSections()}
          </div>
          <div className={'settings-column'}>
            <LargerH3>Feedback Settings</LargerH3>
            {this.renderTestTypeForm()}
            <AudienceSettings testCollection={collection} />
          </div>
        </OuterContainer>
      </ThemeProvider>
    )
  }
}
TestDesigner.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default TestDesigner
