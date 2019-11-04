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

const IdeaCollectionControlsWrapper = styled.div`
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

class IdeaCollectionControls extends React.Component {
  showNextPrevIdea = direction => {
    const { handleSetCurrentIdeaCardIndex, currentIdeaCardIndex } = this.props
    let index
    if (direction === 'next') {
      index = currentIdeaCardIndex + 1
      if (index > this.numIdeas - 1) index = 0
    } else {
      index = currentIdeaCardIndex - 1
      if (index < 0) index = this.numIdeas - 1
    }
    const showIdea = this.ideaCards[index]
    if (!showIdea || showIdea.id === this.currentIdea.id) return
    handleSetCurrentIdeaCardIndex(index)
  }

  addNewIdeaItem = () => {
    const { createNewIdea, collection } = this.props
    const current = this.currentIdea
    createNewIdea({
      parentCollection: collection,
      questionType: 'question_idea',
      order: current.order + 0.5,
    })
  }

  get canDelete() {
    const { canEdit } = this.props
    return canEdit && this.numIdeas > 1
  }

  get ideaCards() {
    const {
      collection: { sortedCards },
    } = this.props
    return sortedCards
  }

  get numIdeas() {
    return this.ideaCards.length
  }

  get currentIdea() {
    const { currentIdeaCardIndex } = this.props
    return this.ideaCards[currentIdeaCardIndex]
  }

  render() {
    const {
      handleTrash,
      showMedia,
      handleToggleShowMedia,
      currentIdeaCardIndex,
    } = this.props
    return (
      <IdeaCollectionControlsWrapper>
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
            {currentIdeaCardIndex + 1}/{this.numIdeas}
          </DisplayText>
          <ChevronCircleWrapper
            last
            onClick={() => this.showNextPrevIdea('next')}
          >
            <ChevronRightIcon />
          </ChevronCircleWrapper>
          {this.canDelete && (
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
      </IdeaCollectionControlsWrapper>
    )
  }
}

IdeaCollectionControls.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  canEdit: PropTypes.bool.isRequired,
  handleTrash: PropTypes.func.isRequired,
  createNewIdea: PropTypes.func.isRequired,
  showMedia: PropTypes.bool.isRequired,
  handleToggleShowMedia: PropTypes.func.isRequired,
  handleSetCurrentIdeaCardIndex: PropTypes.func.isRequired,
  currentIdeaCardIndex: PropTypes.number,
}

IdeaCollectionControls.defaultProps = {
  currentIdeaCardIndex: 0,
}

export default IdeaCollectionControls
