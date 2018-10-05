import { Flex } from 'reflexbox'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import FlipMove from 'react-flip-move'

import { DisplayText, NumberListText } from '~/ui/global/styled/typography'
import { Select, SelectOption } from '~/ui/global/styled/forms'
import v, { ITEM_TYPES } from '~/utils/variables'
import TrashIcon from '~/ui/icons/TrashIcon'
import { TestQuestionHolder } from '~/ui/test_collections/shared'
import { apiStore } from '~/stores/'
// NOTE: Always import these models after everything else, can lead to odd dependency!
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import QuestionHotEdge from '~/ui/test_collections/QuestionHotEdge'
import TestQuestion from '~/ui/test_collections/TestQuestion'

const TopBorder = styled.div`
  background-color: ${v.colors.gray};
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
]

@observer
class TestDesigner extends React.Component {
  handleSelectChange = replacingCard => ev =>
    this.createNewQuestionCard({
      replacingCard,
      questionType: ev.target.value,
    })

  handleTrash = card => {
    // TODO: might *not* want to skipPrompt if the test is currently live
    card.API_archiveSelf()
  }

  handleNew = card => () => {
    this.createNewQuestionCard({ order: card.order + 1 })
  }

  get canEdit() {
    // viewers still see the select forms, but disabled
    const { collection } = this.props
    return collection.can_edit_content
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

  renderHotEdge(card) {
    return <QuestionHotEdge onAdd={this.handleNew(card)} />
  }

  renderQuestionSelectForm(card) {
    const blank = !card.card_question_type
    return (
      <QuestionSelectHolder>
        <NumberListText>{card.order + 1}.</NumberListText>
        {card.card_question_type === 'question_finish' ? (
          <DisplayText>End of Survey</DisplayText>
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
            {selectOptions.map(opt => (
              <SelectOption
                key={opt.value}
                classes={{
                  root: !opt.value ? 'grayedOut' : '',
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
      </QuestionSelectHolder>
    )
  }

  render() {
    const { collection } = this.props
    const cardCount = collection.collection_cards.length
    const inner = collection.collection_cards.map((card, i) => {
      let position
      const item = card.record
      if (i === 0) position = 'question_beginning'
      if (i === cardCount - 1) position = 'question_end'
      const userEditable = [
        'media',
        'question_media',
        'question_description',
      ].includes(card.record.question_type)
      return (
        <FlipMove appearAnimation="fade" key={card.id}>
          <div>
            <Flex
              style={{
                width: '694px',
                flexWrap: 'wrap',
              }}
            >
              {this.renderQuestionSelectForm(card)}
              <TestQuestionHolder editing userEditable={userEditable}>
                <TestQuestion
                  editing
                  parent={collection}
                  card={card}
                  item={item}
                  position={position}
                  order={card.order}
                  canEdit={this.canEdit}
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
      <div>
        <TopBorder />
        {inner}
        <BottomBorder />
      </div>
    )
  }
}

TestDesigner.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default TestDesigner
