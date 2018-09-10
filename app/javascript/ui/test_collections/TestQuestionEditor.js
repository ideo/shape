import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Box } from 'reflexbox'

import GridCard from '~/ui/grid/GridCard'
import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'
import DescriptionQuestion from '~/ui/test_collections/DescriptionQuestion'
import ScaleQuestion from '~/ui/test_collections/ScaleQuestion'
import OpenQuestion from '~/ui/test_collections/OpenQuestion'
import { Select } from '~/ui/global/styled/forms'
import { NumberListText } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import { uiStore } from '~/stores'

const selectOptions = [
  { value: 'context', label: 'Context Setting' },
  { value: 'media', label: 'Photo or Video of Idea' },
  { value: 'description', label: 'Idea Description' },
  { value: 'useful', label: 'Useful' },
  { value: 'open', label: 'Open Response' },
]

const QuestionFormHolder = styled(Box)`
`

const QuestionSelectHolder = styled.div`
  margin-top: 10px;
  margin-right: 20px;
  min-width: 300px;

  /* NOTE: had to hack this rule in here to modify the MUI Input element */
  > div {
    width: calc(100% - 30px);
  }

  @media only screen
    and (max-width: ${v.responsive.medBreakpoint}px) {
    margin-bottom: 10px;
  }
`

const QuestionHolder = styled.div`
  display: flex;

  @media only screen
    and (max-width: ${v.responsive.medBreakpoint}px) {
    flex-direction: column;
    margin-bottom: 10px;
  }
`

// TODO: deal with new colors
const QuestionPreviewHolder = styled.div`
  border-color: ${v.colors.gray};
  border-left-width: 20px;
  border-right-width: 20px;
  border-style: solid;

  @media only screen
    and (max-width: ${v.responsive.medBreakpoint}px) {
    border-width: 0;
    margin-left: 22px;
    margin-right: 28px;
  }
`

const QuestionCardWrapper = styled.div`
  width: 334px;
  height: 250px;
`

@observer
class TestQuestionEditor extends React.Component {
  handleSelectChange = (ev) => {
    // console.log(ev.target.value)
    // TODO: call replace on the card with the new type??
  }

  renderQuestionSelectForm() {
    const { card } = this.props
    return (
      <QuestionSelectHolder>
        <NumberListText>{card.order + 1}.</NumberListText>
        <Select
          classes={{ root: 'select fullWidth', selectMenu: 'selectMenu' }}
          displayEmpty
          name="role"
          value={card.card_question_type}
          onChange={this.handleSelectChange}
        >
          { selectOptions.map(opt => (
            <option
              key={opt.value}
              value={opt.value}
            >
              {opt.label}
            </option>
          ))}
        </Select>
      </QuestionSelectHolder>
    )
  }

  renderQuestion() {
    const { parent, card, item } = this.props
    let inner
    switch (card.card_question_type) {
    case 'context':
      return (
        <ScaleQuestion
          questionText="How satisfied are you with your current solution?"
        />
      )
    case 'useful':
      return (
        <ScaleQuestion
          questionText="How useful is this idea for you?"
          emojiSeries="thumbs"
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
          { inner }
        </QuestionCardWrapper>
      )
    case 'description':
      return <DescriptionQuestion />
    case 'open':
      return (
        <OpenQuestion questionText={item.content} />
      )
    default:
      return ''
    }
  }

  render() {
    return (
      <QuestionHolder>
        <QuestionFormHolder>
          { this.renderQuestionSelectForm() }
        </QuestionFormHolder>
        <QuestionFormHolder>
          <QuestionPreviewHolder>
            { this.renderQuestion() }
          </QuestionPreviewHolder>
        </QuestionFormHolder>
      </QuestionHolder>
    )
  }
}

TestQuestionEditor.propTypes = {
  // parent is the parent collection
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}
export default TestQuestionEditor
