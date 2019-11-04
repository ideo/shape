import PropTypes from 'prop-types'
import v from '~/utils/variables'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { DisplayText, NumberListText } from '~/ui/global/styled/typography'
import TrashIcon from '~/ui/icons/TrashIcon'
import PinnedIcon from '~/ui/icons/PinnedIcon'
import IdeaCollectionControls from '~/ui/test_collections/IdeaCollectionControls'
import QuestionSelector from '~/ui/test_collections/QuestionSelector'
import styled from 'styled-components'

const LeftSideContainer = styled.div`
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

const showTrash = (card, canEdit) => {
  if (!canEdit) return false
  return !['question_finish', 'question_idea'].includes(card.card_question_type)
}

const QuestionLeftSide = ({
  card,
  canEdit,
  cardNumber,
  handleSelectChange,
  handleTrash,
  createNewQuestionCard,
  ideaCollection,
  showMedia,
  handleToggleShowMedia,
  handleSetCurrentIdeaCardIndex,
  currentIdeaCardIndex,
}) => {
  return (
    <LeftSideContainer>
      {!card.card_question_type === 'question_idea' && (
        <NumberListText>{cardNumber}.</NumberListText>
      )}
      {card.card_question_type === 'question_finish' && (
        <DisplayText>End of Survey</DisplayText>
      )}
      {card.card_question_type === 'question_idea' && (
        <IdeaCollectionControls
          collection={ideaCollection}
          cardNumber={cardNumber}
          canEdit={canEdit}
          handleTrash={handleTrash}
          createNewIdea={createNewQuestionCard}
          showMedia={showMedia}
          handleToggleShowMedia={handleToggleShowMedia}
          handleSetCurrentIdeaCardIndex={handleSetCurrentIdeaCardIndex}
          currentIdeaCardIndex={currentIdeaCardIndex}
        />
      )}
      {!['question_finish', 'question_idea'].includes(
        card.card_question_type
      ) && (
        <QuestionSelector
          card={card}
          canEdit={canEdit}
          handleSelectChange={handleSelectChange}
        />
      )}
      {showTrash(card, canEdit) && (
        <TrashButton onClick={() => handleTrash(card)}>
          <TrashIcon />
        </TrashButton>
      )}
      <div style={{ color: v.colors.commonMedium }}>
        {card.isPinnedAndLocked && <PinnedIcon locked />}
        {card.isPinnedInTemplate && <PinnedIcon />}
      </div>
    </LeftSideContainer>
  )
}

QuestionLeftSide.propTypes = {
  card: PropTypes.shape({
    isPinnedInTemplate: PropTypes.bool,
    isPinnedAndLocked: PropTypes.bool,
    order: PropTypes.number.isRequired,
    card_question_type: PropTypes.string,
    section_type: PropTypes.string.isRequired,
  }).isRequired, // specify or use MobxPropTypes?
  canEdit: PropTypes.bool.isRequired,
  cardNumber: PropTypes.number.isRequired,
  handleSelectChange: PropTypes.func.isRequired,
  handleTrash: PropTypes.func.isRequired,
  createNewQuestionCard: PropTypes.func.isRequired,
  showMedia: PropTypes.bool.isRequired,
  handleToggleShowMedia: PropTypes.func.isRequired,
  ideaCollection: MobxPropTypes.objectOrObservableObject.isRequired,
  handleSetCurrentIdeaCardIndex: PropTypes.func.isRequired,
  currentIdeaCardIndex: PropTypes.number,
}

QuestionLeftSide.defaultProps = {
  currentIdeaCardIndex: 0,
}

export default QuestionLeftSide
