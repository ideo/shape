import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import v from '~/utils/variables'
import { DisplayText } from '~/ui/global/styled/typography'
import TrashIcon from '~/ui/icons/TrashIcon'
import PlusCircleIcon from '~/ui/icons/PlusCircleIcon'
import styled from 'styled-components'

const StyledAddIdea = styled.div`
  width: 32px;
  display: inline-block;
  cursor: pointer;
  color: ${v.colors.primaryMedium};
`

const TrashButton = styled.button`
  position: relative;
  top: 6px;
  width: 26px;
  margin-left: 12px;
`

const PrevNextChevron = styled.div`
  width: 16px;
  display: inline-block;
  margin: 0 5px 0 5px;
  cursor: pointer;
`

class IdeaQuestionsControls extends React.Component {
  get nextIdeaCard() {
    const { ideaCards } = this.props
    let prevIndex = this.currentIdeaCardIndex - 1
    if (prevIndex < 0) prevIndex = this.numIdeaCards - 1
    return ideaCards[prevIndex]
  }

  get prevIdeaCard() {
    const { ideaCards } = this.props
    let nextIndex = this.currentIdeaCardIndex + 1
    if (nextIndex > this.numIdeaCards - 1) nextIndex = 0
    return ideaCards[nextIndex]
  }

  showCard = async card => {
    const currentCard = this.currentIdeaCard
    card.hidden = false
    await card.save()
    currentCard.hidden = false
    currentCard.save()
  }

  addNewIdeaItem = () => {
    const { createNewQuestionCard } = this.props
    createNewQuestionCard({
      questionType: 'question_idea',
      order: this.currentIdeaCard.order + 0.5,
      sectionType: 'ideas',
    })
    this.currentIdeaCard.hidden = true
    this.currentIdeaCard.save()
  }

  get numIdeaCards() {
    const { ideaCards } = this.props
    return ideaCards.length
  }

  get currentIdeaCard() {
    const { currentIdeaCardId, ideaCards } = this.props
    return ideaCards.find(card => card.id === currentIdeaCardId)
  }

  get currentIdeaCardIndex() {
    const { ideaCards } = this.props
    return ideaCards.indexOf(this.currentIdeaCard)
  }

  render() {
    const { handleTrash, canEdit } = this.props
    return (
      <Fragment>
        <DisplayText>
          Idea{' '}
          <StyledAddIdea onClick={this.addNewIdeaItem}>
            <PlusCircleIcon />
          </StyledAddIdea>
        </DisplayText>
        <div>
          <PrevNextChevron onClick={() => this.showCard(this.prevIdeaCard)}>
            &lt;
          </PrevNextChevron>
          {this.currentIdeaCardIndex + 1}/{this.numIdeaCards}
          <PrevNextChevron onClick={() => this.showCard(this.nextIdeaCard)}>
            &gt;
          </PrevNextChevron>
          {canEdit && (
            <TrashButton onClick={() => handleTrash(this.currentIdeaCard)}>
              <TrashIcon />
            </TrashButton>
          )}
        </div>
      </Fragment>
    )
  }
}

IdeaQuestionsControls.propTypes = {
  currentIdeaCardId: MobxPropTypes.objectOrObservableObject.isRequired,
  ideaCards: PropTypes.array.isRequired,
  canEdit: PropTypes.bool.isRequired,
  handleTrash: PropTypes.func.isRequired,
  createNewQuestionCard: PropTypes.func.isRequired,
}

export default IdeaQuestionsControls
