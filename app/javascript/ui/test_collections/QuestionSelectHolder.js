import PropTypes from 'prop-types'
import { kebabCase } from 'lodash'
import v, { TEST_COLLECTION_SELECT_OPTIONS } from '~/utils/variables'
import { Select, SelectOption } from '~/ui/global/styled/forms'
import { DisplayText, NumberListText } from '~/ui/global/styled/typography'
import TrashIcon from '~/ui/icons/TrashIcon'
import PinnedIcon from '~/ui/icons/PinnedIcon'
import IdeaQuestionsControls from '~/ui/test_collections/IdeaQuestionsControls'
import styled from 'styled-components'

const SelectHolderContainer = styled.div`
  margin-top: 10px;
  margin-right: 14px;
  width: 300px;

  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    margin-bottom: 20px;
    max-width: 400px;
  }
`

const TrashButton = styled.button`
  position: relative;
  top: 6px;
  width: 26px;
  margin-left: 12px;
`

function optionSort(a, b) {
  if (b.value === '') return 1
  return a.label.localeCompare(b.label)
}

const questionSelectOption = opt => {
  const { value, label, category } = opt

  let rootClass
  if (category) rootClass = 'category'
  else if (!value) rootClass = 'grayedOut'
  else rootClass = 'selectOption'

  return (
    <SelectOption
      key={value}
      classes={{
        root: rootClass,
        selected: 'selected',
      }}
      disabled={!value}
      value={value}
    >
      <span data-cy={`QuestionSelectOption-${kebabCase(label)}`}>{label}</span>
    </SelectOption>
  )
}

const dropdownOrQuestionText = ({
  card,
  handleSelectChange,
  canEdit,
  handleTrash,
  createNewQuestionCard,
  ideaCards,
}) => {
  const blank = !card.card_question_type
  switch (card.card_question_type) {
    case 'question_finish':
      return <DisplayText>End of Survey</DisplayText>
    case 'question_idea':
      return (
        <IdeaQuestionsControls
          currentIdeaCardId={card.id}
          ideaCards={ideaCards}
          canEdit={canEdit}
          handleTrash={handleTrash}
          createNewQuestionCard={createNewQuestionCard}
        />
      )
    default:
      return (
        <Select
          classes={{
            root: 'select fixedWidth',
            select: blank ? 'grayedOut' : '',
            selectMenu: 'selectMenu bottomPadded',
          }}
          displayEmpty
          disabled={!canEdit}
          name="role"
          value={card.card_question_type || ''}
          onChange={handleSelectChange(card)}
        >
          {TEST_COLLECTION_SELECT_OPTIONS.map(optGroup => {
            const options = []
            optGroup.values.sort(optionSort).forEach(opt => {
              if (opt.sections.includes(card.section_type)) options.push(opt)
            })
            // Don't show this category if there aren't any options
            if (options.length === 0) return
            if (optGroup.category) {
              options.unshift({
                value: '',
                label: optGroup.category,
                category: true,
              })
            }
            return options.map(opt => questionSelectOption(opt))
          })}
        </Select>
      )
  }
}

const QuestionSelectHolder = ({
  card,
  canEdit,
  handleSelectChange,
  handleTrash,
  createNewQuestionCard,
  ideaCards,
}) => {
  return (
    <SelectHolderContainer>
      <NumberListText>{card.order + 1}.</NumberListText>
      {dropdownOrQuestionText({
        card,
        handleSelectChange,
        canEdit,
        handleTrash,
        createNewQuestionCard,
        ideaCards,
      })}
      {canEdit &&
        !['question_finish', 'question_idea'].includes(
          card.card_question_type
        ) && (
          <TrashButton onClick={() => handleTrash(card)}>
            <TrashIcon />
          </TrashButton>
        )}
      <div style={{ color: v.colors.commonMedium }}>
        {card.isPinnedAndLocked && <PinnedIcon locked />}
        {card.isPinnedInTemplate && <PinnedIcon />}
      </div>
    </SelectHolderContainer>
  )
}

QuestionSelectHolder.propTypes = {
  card: PropTypes.shape({
    isPinnedInTemplate: PropTypes.bool,
    isPinnedAndLocked: PropTypes.bool,
    order: PropTypes.number.isRequired,
    card_question_type: PropTypes.string,
    section_type: PropTypes.string.isRequired,
  }).isRequired, // specify or use MobxPropTypes?
  canEdit: PropTypes.bool.isRequired,
  handleSelectChange: PropTypes.func.isRequired,
  handleTrash: PropTypes.func.isRequired,
  createNewQuestionCard: PropTypes.func.isRequired,
  ideaCards: PropTypes.array.isRequired,
}

export default QuestionSelectHolder
