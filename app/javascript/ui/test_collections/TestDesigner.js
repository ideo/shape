import PropTypes from 'prop-types'
import { Flex } from 'reflexbox'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import { NumberListText } from '~/ui/global/styled/typography'
import { Select, SelectOption } from '~/ui/global/styled/forms'
import v, { ITEM_TYPES } from '~/utils/variables'
import { apiStore, uiStore } from '~/stores/'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import QuestionHotEdge from './QuestionHotEdge'
import TestQuestionEditor from './TestQuestionEditor'

const TopThing = styled.div`
  background-color: ${v.colors.gray};
  border-radius: 7px 7px 0 0;
  height: 16px;
  margin-left: 320px;
  width: 374px;

  @media only screen
    and (max-width: ${v.responsive.medBreakpoint}px) {
    display: none;
  }
`
const BottomThing = TopThing.extend`
  border-radius: 0 0 7px 7px;
`

const TestQuestionHolder = styled.div`
  background-color: ${props => (props.userEditable ? '#9FC1CB' : '#5698AE')};
  border-color: ${props => (props.editing ? v.colors.gray : '#9ec1cc')};
  border-bottom-width: 0;
  border-left-width: ${props => (props.editing ? '20px' : '0')};
  border-right-width: ${props => (props.editing ? '20px' : '0')};
  border-style: solid;
  border-top-width: ${props => (props.editing ? '6px' : 0)};
  margin-bottom: ${props => (props.editing ? 0 : '6px')};
  width: ${props => (props.editing ? '334px' : '100%')};

  @media only screen
    and (max-width: ${v.responsive.medBreakpoint}px) {
    border-width: 0;
    margin-left: 22px;
    margin-right: 28px;
  }

  &:last {
    margin-bottom: 0;
  }
`

const QuestionSelectHolder = styled.div`
  margin-top: 10px;
  margin-right: 20px;
  width: 300px;

  @media only screen
    and (max-width: ${v.responsive.medBreakpoint}px) {
    margin-bottom: 10px;
  }
`

const selectOptions = [
  { value: null, label: 'select question type' },
  { value: 'context', label: 'Context Setting' },
  { value: 'media', label: 'Photo or Video of Idea' },
  { value: 'description', label: 'Idea Description' },
  { value: 'useful', label: 'Useful' },
  { value: 'open', label: 'Open Response' },
]

@observer
class TestDesigner extends React.Component {
  handleNew = (card) => {
    this.createNewQuestion(card.order + 0.5)
  }

  async createNewQuestion(order) {
    const attrs = {
      order,
      width: 1,
      height: 1,
      parent_id: uiStore.viewingCollection.id,
      item_attributes: {
        type: ITEM_TYPES.QUESTION,
      },
    }
    const card = new CollectionCard(attrs, apiStore)
    card.parent = uiStore.viewingCollection
    await card.API_create()
  }

  renderHotEdge(card) {
    return <QuestionHotEdge onAdd={() => this.handleNew(card)} />
  }

  renderQuestionSelectForm(card) {
    return (
      <QuestionSelectHolder>
        <NumberListText>{card.order + 1}.</NumberListText>
        <Select
          classes={{ root: 'select fullWidth', selectMenu: 'selectMenu' }}
          displayEmpty
          name="role"
          value={card.card_question_type}
          onChange={this.handleSelectChange}
          onDefault={!card.card_question_type}
        >
          {selectOptions.map(opt => (
            <SelectOption
              key={opt.value}
              value={opt.value}
              defaultOption={!opt.value}
            >
              {opt.label}
            </SelectOption>
          ))}
        </Select>
      </QuestionSelectHolder>
    )
  }

  render() {
    const { collection, editing } = this.props
    const cardCount = collection.collection_cards.length
    const inner = (
      collection.collection_cards.map((card, i) => {
        let position
        if (i === 0) position = 'beginning'
        if (i === cardCount - 1) position = 'end'
        if (!editing) {
          card.record.menuDisabled = true
        }
        const userEditable = editing &&
          ['media', 'description'].includes(card.record.question_type)
        return (
          <Flex style={{
            width: editing ? '694px' : 'auto',
            flexWrap: 'wrap',
          }}
          >
            {editing &&
              this.renderQuestionSelectForm(card)
            }
            <TestQuestionHolder editing={editing} userEditable={userEditable}>
              <TestQuestionEditor
                key={card.id}
                parent={collection}
                card={card}
                item={card.record}
                position={position}
                order={card.order}
                editing={editing}
              />
            </TestQuestionHolder>
            {editing &&
              this.renderHotEdge(card)
            }
          </Flex>
        )
      })
    )

    return (
      <div>
        {editing && <TopThing />}
        {inner}
        {editing && <BottomThing />}
      </div>
    )
  }
}

TestDesigner.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  editing: PropTypes.bool.isRequired,
}

export default TestDesigner
