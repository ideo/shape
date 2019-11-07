import PropTypes from 'prop-types'
import { kebabCase } from 'lodash'
import { TEST_COLLECTION_SELECT_OPTIONS } from '~/utils/variables'
import { Select, SelectOption } from '~/ui/global/styled/forms'

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

const QuestionSelector = ({ card, canEdit, handleSelectChange }) => {
  const blank = !card.card_question_type
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

QuestionSelector.propTypes = {
  card: PropTypes.shape({
    isPinnedInTemplate: PropTypes.bool,
    isPinnedAndLocked: PropTypes.bool,
    order: PropTypes.number.isRequired,
    card_question_type: PropTypes.string,
    section_type: PropTypes.string.isRequired,
  }).isRequired, // specify or use MobxPropTypes?
  canEdit: PropTypes.bool.isRequired,
  handleSelectChange: PropTypes.func.isRequired,
}

export default QuestionSelector
