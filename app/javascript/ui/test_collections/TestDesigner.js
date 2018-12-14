import _ from 'lodash'
import { Flex } from 'reflexbox'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled, { ThemeProvider } from 'styled-components'
import FlipMove from 'react-flip-move'

import { DisplayText, NumberListText } from '~/ui/global/styled/typography'
import { Select, SelectOption } from '~/ui/global/styled/forms'
import v, { ITEM_TYPES } from '~/utils/variables'
import TrashIcon from '~/ui/icons/TrashIcon'
import {
  TestQuestionHolder,
  styledTestTheme,
} from '~/ui/test_collections/shared'
import QuestionHotEdge from '~/ui/test_collections/QuestionHotEdge'
import TestQuestion from '~/ui/test_collections/TestQuestion'
import RadioControl from '~/ui/global/RadioControl'
import PinnedIcon from '~/ui/icons/PinnedIcon'
import { apiStore } from '~/stores'
// NOTE: Always import these models after everything else, can lead to odd dependency!
import CollectionCard from '~/stores/jsonApi/CollectionCard'

const TopBorder = styled.div`
  background-color: ${props => props.theme.borderColorEditing};
  border-radius: 7px 7px 0 0;
  height: 16px;
  margin-left: 320px;
  width: 374px;

  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    display: none;
  }
`
const BottomBorder = TopBorder.extend`
  border-radius: 0 0 7px 7px;
`

const QuestionSelectHolder = styled.div`
  margin-top: 10px;
  margin-right: 20px;
  width: 300px;

  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    margin-bottom: 20px;
    width: auto;
    max-width: 400px;
  }
`

const TrashButton = styled.button`
  position: relative;
  top: 6px;
  width: 26px;
  margin-left: 12px;
`

const selectOptions = [
  { value: '', label: 'select question type' },
  { value: 'question_context', label: 'Context Setting' },
  { value: 'question_media', label: 'Photo or Video of Idea' },
  { value: 'question_description', label: 'Idea Description' },
  { value: 'question_useful', label: 'Useful' },
  { value: 'question_open', label: 'Open Response' },
  { value: 'question_excitement', label: 'Excitement' },
  { value: 'question_clarity', label: 'Clarity' },
  { value: 'question_different', label: 'Different' },
  { value: 'question_category_satisfaction', label: 'Category Satisfaction' },
]

function optionSort(a, b) {
  if (b.value === '') return 1
  return a.label.localeCompare(b.label)
}

@observer
class TestDesigner extends React.Component {
  constructor(props) {
    super(props)
    const { collection_to_test } = props.collection
    this.state = {
      testType: collection_to_test ? 'collection' : 'media',
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

  confirmEdit = action => {
    const { collection } = this.props
    collection.confirmEdit({
      onConfirm: () => action(),
    })
  }

  handleSelectChange = replacingCard => ev =>
    this.confirmEdit(() => {
      this.createNewQuestionCard({
        replacingCard,
        questionType: ev.target.value,
      })
    })

  handleTrash = card => {
    this.confirmEdit(() => card.API_archiveSelf())
  }

  handleNew = (card, addBefore) => () => {
    this.confirmEdit(() => {
      const order = addBefore ? card.order - 0.5 : card.order + 1
      this.createNewQuestionCard({ order })
    })
  }

  archiveMediaCardsIfDefaultState() {
    const { collection_cards } = this.props.collection
    const [first, second, third] = collection_cards
    // basic check to see if we are (roughly) in the default state
    const defaultState =
      first &&
      second &&
      third &&
      first.card_question_type === 'question_media' &&
      second.card_question_type === 'question_description' &&
      third.card_question_type === 'question_useful' &&
      collection_cards.length === 4
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
      return card.API_replace({ replacingId: replacingCard.id })
    }
    return card.API_create()
  }

  renderHotEdge(card, addBefore = false) {
    return <QuestionHotEdge onAdd={this.handleNew(card, addBefore)} />
  }

  renderQuestionSelectForm(card) {
    const blank = !card.card_question_type
    return (
      <QuestionSelectHolder>
        <NumberListText>{card.order + 1}.</NumberListText>
        {card.card_question_type === 'question_finish' ? (
          <DisplayText color={v.colors.white}>End of Survey</DisplayText>
        ) : (
          <Select
            classes={{
              root: 'select fixedWidth',
              select: blank ? 'grayedOut' : '',
              selectMenu: 'selectMenu',
            }}
            displayEmpty
            disabled={!this.canEdit}
            name="role"
            value={card.card_question_type || ''}
            onChange={this.handleSelectChange(card)}
          >
            {selectOptions.sort(optionSort).map(opt => (
              <SelectOption
                key={opt.value}
                classes={{
                  root: !opt.value ? 'grayedOut' : 'selectOption',
                  selected: 'selected',
                }}
                disabled={!opt.value}
                value={opt.value}
              >
                <span data-cy="QuestionSelectOption">{opt.label}</span>
              </SelectOption>
            ))}
          </Select>
        )}
        {this.canEdit &&
          card.card_question_type !== 'question_finish' && (
            <TrashButton onClick={() => this.handleTrash(card)}>
              <TrashIcon />
            </TrashButton>
          )}
        <div style={{ color: v.colors.commonMedium }}>
          {card.isPinnedAndLocked && <PinnedIcon locked />}
          {card.isPinnedInTemplate && <PinnedIcon />}
        </div>
      </QuestionSelectHolder>
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

  render() {
    const { collection } = this.props
    const cardCount = collection.collection_cards.length
    const inner = collection.collection_cards.map((card, i) => {
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
          <div>
            <Flex
              style={{
                width: '694px',
                flexWrap: 'wrap',
              }}
            >
              {i === 0 && this.canEdit && this.renderHotEdge(card, true)}
              {this.renderQuestionSelectForm(card)}
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
            </Flex>
          </div>
        </FlipMove>
      )
    })

    return (
      <ThemeProvider theme={this.styledTheme}>
        <div>
          {this.renderTestTypeForm()}
          <TopBorder />
          {inner}
          <BottomBorder />
        </div>
      </ThemeProvider>
    )
  }
}

TestDesigner.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default TestDesigner
