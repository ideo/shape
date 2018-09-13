import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import GridCard from '~/ui/grid/GridCard'
import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'
import DescriptionQuestion from '~/ui/test_collections/DescriptionQuestion'
import NewQuestionGraphic from '~/ui/icons/NewQuestionGraphic'
import ScaleQuestion from '~/ui/test_collections/ScaleQuestion'
import OpenQuestion from '~/ui/test_collections/OpenQuestion'
import v, { ITEM_TYPES } from '~/utils/variables'
import { apiStore, uiStore } from '~/stores'
// NOTE: Always import these models after everything else, can lead to odd dependency!
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import { QuestionText } from './shared'

const QuestionHolder = styled.div`
  display: flex;
  ${props => props.empty && 'margin-bottom: -6px;'}

  @media only screen
    and (max-width: ${v.responsive.medBreakpoint}px) {
    flex-direction: column;
    margin-bottom: 10px;
  }
`

const QuestionCardWrapper = styled.div`
  width: 334px;
  height: 250px;
`

@observer
class TestQuestionEditor extends React.Component {
  handleSelectChange = (ev) => {
    const { card } = this.props
    const attrs = {
      item_attributes: {
        type: ITEM_TYPES.QUESTION,
        question_type: ev.target.value,
      },
      order: card.order,
      parent_id: card.parent.id,
    }
    const newCard = new CollectionCard(attrs, apiStore)
    newCard.parent = card.parent
    newCard.API_replace({ replacingId: card.id })
  }

  renderQuestion() {
    const { parent, card, item, editing } = this.props
    let inner
    switch (card.card_question_type) {
    case 'context':
      return (
        <ScaleQuestion
          questionText="How satisfied are you with your current solution?"
          editing={editing}
        />
      )
    case 'useful':
      return (
        <ScaleQuestion
          questionText="How useful is this idea for you?"
          emojiSeries="thumbs"
          editing={editing}
        />
      )
    case 'media':
      if (
        item.type === 'Item::QuestionItem' ||
        uiStore.blankContentToolState.replacingId === card.id
      ) {
        // this case means it is set to "blank / add your media"
        inner = (
          <GridCardBlank
            parent={parent}
            height={1}
            order={card.order}
            replacingId={card.id}
            testCollectionCard
          />
        )
      } else {
        inner = (
          <GridCard
            card={card}
            cardType="items"
            record={card.record}
            menuOpen={uiStore.openCardMenuId === card.id}
            testCollectionCard
          />
        )
      }
      return (
        <QuestionCardWrapper>
          {inner}
        </QuestionCardWrapper>
      )
    case 'description':
      if (editing) {
        return (
          <DescriptionQuestion
            item={item}
          />
        )
      }
      return <QuestionText>{item.content}</QuestionText>

    case 'open':
      return (
        <OpenQuestion
          item={item}
          editing={editing}
        />
      )
    default:
      return <NewQuestionGraphic />
    }
  }

  render() {
    const { card } = this.props
    return (
      <QuestionHolder empty={!card.card_question_type}>
        {this.renderQuestion()}
      </QuestionHolder>
    )
  }
}

TestQuestionEditor.propTypes = {
  // parent is the parent collection
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  editing: PropTypes.bool.isRequired,
}
export default TestQuestionEditor
