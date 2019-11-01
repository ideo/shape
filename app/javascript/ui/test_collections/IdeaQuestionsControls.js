import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import v from '~/utils/variables'
import { DisplayText } from '~/ui/global/styled/typography'
import TrashIcon from '~/ui/icons/TrashIcon'
import PlusCircleIcon from '~/ui/icons/PlusCircleIcon'
import ChevronLeftIcon from '~/ui/icons/ChevronLeftIcon'
import ChevronRightIcon from '~/ui/icons/ChevronRightIcon'
import { Checkbox, LabelContainer } from '~/ui/global/styled/forms'
import styled from 'styled-components'

const IdeaQuestionsControlsWrapper = styled.div`
  display: inline-block;
`

const IdeaLabel = styled.div`
  border-bottom: 1px solid ${v.colors.black};
  display: inline-block;
  width: 200px;
`

const StyledAddIdea = styled.div`
  width: 32px;
  cursor: pointer;
  color: ${v.colors.primaryMedium};
  display: inline-block;
  position: relative;
  top: 10px;
`

const StyledIdeaNavigation = styled.div`
  margin-top: 15px;
`

const TrashButton = styled.button`
  position: relative;
  top: 6px;
  width: 26px;
  margin-left: 20px;
`

const ChevronCircleWrapper = styled.div`
  width: 16px;
  height: 16px;
  position: relative;
  top: 3px;
  display: inline-block;
  ${props => props.first && 'margin-right: 7px;'}
  ${props => props.last && 'margin-left: 7px;'}
  cursor: pointer;
  border-radius: 50%;
  background-color: ${v.colors.commonMedium};
  color: ${v.colors.white};
`

class IdeaQuestionsControls extends React.Component {
  showNextPrevIdea = async direction => {
    const { ideaCards } = this.props
    let index
    if (direction === 'next') {
      index = this.currentIdeaIndex + 1
      if (index > this.numIdeas - 1) index = 0
    } else {
      index = this.currentIdeaIndex - 1
      if (index < 0) index = this.numIdeas - 1
    }
    const showIdea = ideaCards[index]
    if (!showIdea || showIdea.id === this.currentIdea.id) return
    this.currentIdea.hidden = true
    await this.currentIdea.save()
    showIdea.hidden = false
    showIdea.save()
  }

  addNewIdeaItem = async () => {
    const { createNewIdea } = this.props
    const current = this.currentIdea
    const newIdea = await createNewIdea({
      questionType: 'question_idea',
      order: current.order + 0.5,
      sectionType: 'ideas',
    })
    if (newIdea.id) {
      current.hidden = true
      current.save()
    }
  }

  get numIdeas() {
    const { ideaCards } = this.props
    return ideaCards.length
  }

  get currentIdea() {
    const { currentIdeaCardId, ideaCards } = this.props
    return ideaCards.find(card => card.id === currentIdeaCardId.toString())
  }

  get currentIdeaIndex() {
    const { ideaCards } = this.props
    return ideaCards.indexOf(this.currentIdea)
  }

  render() {
    const {
      handleTrash,
      canEdit,
      showMedia,
      handleToggleShowMedia,
    } = this.props
    return (
      <IdeaQuestionsControlsWrapper>
        <DisplayText>
          <IdeaLabel>Idea</IdeaLabel>
          <StyledAddIdea onClick={this.addNewIdeaItem}>
            <PlusCircleIcon />
          </StyledAddIdea>
        </DisplayText>
        <StyledIdeaNavigation>
          <ChevronCircleWrapper
            first
            onClick={() => this.showNextPrevIdea('prev')}
          >
            <ChevronLeftIcon />
          </ChevronCircleWrapper>
          <DisplayText>
            {this.currentIdeaIndex + 1}/{this.numIdeas}
          </DisplayText>
          <ChevronCircleWrapper
            last
            onClick={() => this.showNextPrevIdea('next')}
          >
            <ChevronRightIcon />
          </ChevronCircleWrapper>
          {canEdit && (
            <TrashButton onClick={() => handleTrash(this.currentIdea)}>
              <TrashIcon />
            </TrashButton>
          )}
        </StyledIdeaNavigation>
        <LabelContainer
          classes={{ label: 'form-control' }}
          labelPlacement={'end'}
          control={
            <Checkbox
              data-cy={`test-show-media-checkbox`}
              checked={showMedia}
              onChange={handleToggleShowMedia}
              value={'1'}
              color={'default'}
            />
          }
          label={
            <div style={{ paddingTop: '13px' }}>
              <DisplayText>include photo/video</DisplayText>
            </div>
          }
        />
      </IdeaQuestionsControlsWrapper>
    )
  }
}

IdeaQuestionsControls.propTypes = {
  currentIdeaCardId: PropTypes.number.isRequired,
  ideaCards: PropTypes.arrayOf(MobxPropTypes.objectOrObservableObject)
    .isRequired,
  canEdit: PropTypes.bool.isRequired,
  handleTrash: PropTypes.func.isRequired,
  createNewIdea: PropTypes.func.isRequired,
  showMedia: PropTypes.bool.isRequired,
  handleToggleShowMedia: PropTypes.func.isRequired,
}

export default IdeaQuestionsControls
