import PropTypes from 'prop-types'
import v, { TEST_COLLECTION_SELECT_OPTIONS } from '~/utils/variables'
import { Select, SelectOption } from '~/ui/global/styled/forms'
import { DisplayText, NumberListText } from '~/ui/global/styled/typography'
import TrashIcon from '~/ui/icons/TrashIcon'
import PinnedIcon from '~/ui/icons/PinnedIcon'
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

const QuestionSelectHolder = ({
  card,
  canEdit,
  handleSelectChange,
  handleTrash,
}) => {
  const blank = !card.card_question_type
  return (
    <SelectHolderContainer>
      <NumberListText>{card.order + 1}.</NumberListText>
      {card.card_question_type === 'question_finish' ? (
        <DisplayText>End of Survey</DisplayText>
      ) : (
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
          {TEST_COLLECTION_SELECT_OPTIONS.sort(optionSort).map(opt => (
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
      {canEdit &&
        card.card_question_type !== 'question_finish' && (
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
    card_question_type: PropTypes.string.isRequired,
  }).isRequired, // specify or use MobxPropTypes?
  canEdit: PropTypes.bool.isRequired,
  handleSelectChange: PropTypes.func.isRequired,
  handleTrash: PropTypes.func.isRequired,
}

export default QuestionSelectHolder
