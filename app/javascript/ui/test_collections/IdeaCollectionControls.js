import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import v from '~/utils/variables'
import { DisplayText, NumberListText } from '~/ui/global/styled/typography'
import TrashIcon from '~/ui/icons/TrashIcon'
import PlusCircleIcon from '~/ui/icons/PlusCircleIcon'
import ChevronLeftIcon from '~/ui/icons/ChevronLeftIcon'
import ChevronRightIcon from '~/ui/icons/ChevronRightIcon'
import { Checkbox, LabelContainer } from '~/ui/global/styled/forms'
import Tooltip from '~/ui/global/Tooltip'
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

const StyledNavigationAndCheckboxWrapper = styled.div`
  margin-top: 10px;
  margin-left: 25px;
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
    createNewIdea({
      parentCollection: collection,
      questionType: 'question_idea',
      sectionType: 'ideas',
      order: this.currentIdea.order + 0.5,
    })
  }

  confirmWithDialog = ({ prompt, onConfirm }) => {
    const { collection } = this.props
    collection.apiStore.uiStore.confirm({
      prompt,
      confirmText: 'Remove',
      iconName: 'Alert',
      onConfirm: () => onConfirm(),
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
      cardNumber,
      handleToggleShowMedia,
      currentIdeaCardIndex,
    } = this.props
    return (
      <IdeaCollectionControlsWrapper>
        <NumberListText>{cardNumber}.</NumberListText>
        <DisplayText>
          <IdeaLabel>Idea</IdeaLabel>
          <StyledAddIdea onClick={this.addNewIdeaItem} data-cy="add-new-idea">
            <PlusCircleIcon />
          </StyledAddIdea>
        </DisplayText>
        <StyledNavigationAndCheckboxWrapper>
          <ChevronCircleWrapper
            first
            onClick={() => this.showNextPrevIdea('prev')}
          >
            <ChevronLeftIcon />
          </ChevronCircleWrapper>
          <DisplayText data-cy="num-ideas">
            {currentIdeaCardIndex + 1}/{this.numIdeas}
          </DisplayText>
          <ChevronCircleWrapper
            last
            onClick={() => this.showNextPrevIdea('next')}
          >
            <ChevronRightIcon />
          </ChevronCircleWrapper>
          {this.canDelete && (
            <Tooltip
              classes={{ tooltip: 'Tooltip' }}
              title={'remove idea'}
              placement="top"
            >
              <TrashButton
                onClick={() =>
                  this.confirmWithDialog({
                    prompt:
                      'Are you sure you want to remove this idea? This action can not be undone.',
                    onConfirm: () => handleTrash(this.currentIdea),
                  })
                }
              >
                <TrashIcon />
              </TrashButton>
            </Tooltip>
          )}
          <div style={{ marginLeft: '9px' }}>
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
                <div style={{ paddingTop: '14px' }}>
                  <DisplayText>include photo/video</DisplayText>
                </div>
              }
            />
          </div>
        </StyledNavigationAndCheckboxWrapper>
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
  cardNumber: PropTypes.number.isRequired,
  currentIdeaCardIndex: PropTypes.number,
}

IdeaCollectionControls.defaultProps = {
  currentIdeaCardIndex: 0,
}

export default IdeaCollectionControls
