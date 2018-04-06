import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'
import Snackbar, { SnackbarContent } from 'material-ui/Snackbar'
import MoveArrowIcon from '~/ui/icons/MoveArrowIcon'
import CloseIcon from '~/ui/icons/CloseIcon'

const StyledSnackbar = styled(Snackbar)`
  &.Snackbar {
    width: 100%;
    top: auto;
    max-width: 673px;
    margin-bottom: 35px;
    flex-grow: 1;
    color: white;
    background-color: transparent;
  }
`

const StyledSnackbarContent = styled(SnackbarContent)`
  &.SnackbarContent {
    background-color: ${v.colors.cloudy};
    max-width: none;
    padding: 15px 30px;
    width: 100%;
  }
`

// This text is different from other typography
const StyledMoveText = styled.span`
  text-transform: uppercase;
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  font-weight: ${v.weights.book};
  letter-spacing: 0.1rem;
  color: white;
`

const IconHolder = styled.span`
  margin-left: 40px;
  margin-top: 8px;
  width: 16px;
`

const CloseIconHolder = styled.span`
  margin-left: 60px;
  width: 16px;
`

@inject('uiStore', 'apiStore')
@observer
class MoveModal extends React.Component {
  handleClose = (ev) => {
    ev.preventDefault()
    const { uiStore } = this.props
    uiStore.closeMoveMenu()
    // Notify the user if they're on a different collection
    if (uiStore.movingFromCollectionId !== uiStore.viewingCollection.id) {
      if (uiStore.cardAction === 'move') {
        uiStore.alert({
          prompt: 'Your items have been returned to their original location',
          iconName: 'Back',
        })
      }
    }
  }

  moveCards = async (placement) => {
    const { uiStore, apiStore } = this.props
    const collectionId = uiStore.viewingCollection.id
    if (!uiStore.viewingCollection.can_edit) {
      uiStore.alert({
        prompt: 'You don\'t have permission to move items to this collection',
      })
      return
    }
    const data = {
      to_id: collectionId,
      from_id: uiStore.movingFromCollectionId,
      collection_card_ids: uiStore.movingCardIds,
      placement,
    }
    try {
      if (uiStore.cardAction === 'move') {
        await apiStore.request('collection_cards/move', 'PATCH', data)
      } else if (uiStore.cardAction === 'link') {
        await apiStore.request('collection_cards/link', 'POST', data)
      }
      uiStore.resetSelectionAndBCT()
    } catch (e) {
      uiStore.alert({
        prompt: 'You cannot move a collection within itself',
      })
    }
  }

  handleMoveToBeginning = () => {
    this.moveCards('beginning')
  }

  handleMoveToEnd = () => {
    this.moveCards('end')
  }

  render() {
    const { uiStore } = this.props
    const amount = uiStore.movingCardIds.length

    return (
      <div>
        { uiStore.movingCardIds.length > 0 && (
          <StyledSnackbar
            classes={{ root: 'Snackbar', }}
            open
          >
            <StyledSnackbarContent
              classes={{ root: 'SnackbarContent', }}
              message={<StyledMoveText id="message-id">
                {amount} in transit</StyledMoveText>}
              action={[
                <IconHolder key="moveup">
                  <button onClick={this.handleMoveToBeginning}>
                    <MoveArrowIcon direction="up" />
                  </button>
                </IconHolder>,
                <IconHolder key="movedown">
                  <button onClick={this.handleMoveToEnd}>
                    <MoveArrowIcon direction="down" />
                  </button>
                </IconHolder>,
                <CloseIconHolder key="close">
                  <button onClick={this.handleClose}>
                    <CloseIcon />
                  </button>
                </CloseIconHolder>,
              ]}
            />
          </StyledSnackbar>
        )}
      </div>
    )
  }
}

MoveModal.propTypes = {
}
MoveModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
MoveModal.defaultProps = {
}

export default MoveModal
