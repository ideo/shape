import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import Snackbar, { SnackbarContent } from 'material-ui/Snackbar'
import { Tooltip } from '~/ui/global/styled/layout'

import v from '~/utils/variables'
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
    // Notify the user if they're on a different collection
    if (uiStore.viewingCollection &&
        uiStore.movingFromCollectionId !== uiStore.viewingCollection.id) {
      if (uiStore.cardAction === 'move') {
        uiStore.alert(
          'Your items have been returned to their original location',
          'Back'
        )
      }
    }
    uiStore.closeMoveMenu()
  }

  moveCards = async (placement) => {
    const { uiStore, apiStore } = this.props
    // Viewing collection might not be set, such as on the search page
    if (!uiStore.viewingCollection) {
      uiStore.alert('You can\'t move an item here')
      return
    }
    const collectionId = uiStore.viewingCollection.id
    if (!uiStore.viewingCollection.can_edit) {
      uiStore.alert('You don\'t have permission to move items to this collection')
      return
    }
    const data = {
      to_id: collectionId,
      from_id: uiStore.movingFromCollectionId,
      collection_card_ids: uiStore.movingCardIds,
      placement,
    }
    try {
      let successMessage
      if (uiStore.cardAction === 'move') {
        await apiStore.request('collection_cards/move', 'PATCH', data)
        successMessage = 'Items successfully moved!'
      } else if (uiStore.cardAction === 'link') {
        await apiStore.request('collection_cards/link', 'POST', data)
        successMessage = 'Items successfully linked!'
      } else if (uiStore.cardAction === 'duplicate') {
        await apiStore.request('collection_cards/duplicate', 'POST', data)
        // have to re-fetch here because the duplicate method wasn't re-rendering
        // see note in collection_cards_controller#duplicate
        await apiStore.request(`collections/${collectionId}`)
        successMessage = 'Items successfully duplicated!'
      }
      uiStore.alertOk(successMessage)
      uiStore.resetSelectionAndBCT()
      uiStore.closeMoveMenu()
      if (placement === 'beginning') {
        uiStore.scroll.scrollToTop()
      } else {
        uiStore.scroll.scrollToBottom()
      }
    } catch (e) {
      uiStore.alert('You cannot move a collection within itself')
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
    const { cardAction } = uiStore
    const amount = uiStore.movingCardIds.length
    const moveMessage = cardAction === 'move'
      ? `${amount} in transit`
      : `${amount} selected to ${cardAction}`

    return (
      <div>
        { uiStore.movingCardIds.length > 0 && (
          <StyledSnackbar
            classes={{ root: 'Snackbar', }}
            open
          >
            <StyledSnackbarContent
              classes={{ root: 'SnackbarContent', }}
              message={
                <StyledMoveText id="message-id">{moveMessage}</StyledMoveText>
              }
              action={[
                <IconHolder key="moveup">
                  <Tooltip
                    classes={{ tooltip: 'Tooltip' }}
                    title="Place at top"
                    placement="top"
                  >
                    <button onClick={this.handleMoveToBeginning}>
                      <MoveArrowIcon direction="up" />
                    </button>
                  </Tooltip>
                </IconHolder>,
                <IconHolder key="movedown">
                  <Tooltip
                    classes={{ tooltip: 'Tooltip' }}
                    title="Place at bottom"
                    placement="top"
                  >
                    <button onClick={this.handleMoveToEnd}>
                      <MoveArrowIcon direction="down" />
                    </button>
                  </Tooltip>
                </IconHolder>,
                <CloseIconHolder key="close">
                  <Tooltip
                    classes={{ tooltip: 'Tooltip' }}
                    title="Cancel"
                    placement="top"
                  >
                    <button onClick={this.handleClose}>
                      <CloseIcon />
                    </button>
                  </Tooltip>
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
