import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, runInAction } from 'mobx'
import styled from 'styled-components'

import CloseIcon from '~/ui/icons/CloseIcon'
import InlineLoader from '~/ui/layout/InlineLoader'
import MoveArrowIcon from '~/ui/icons/MoveArrowIcon'
import MoveHelperModal from '~/ui/users/MoveHelperModal'
import Tooltip from '~/ui/global/Tooltip'
import {
  StyledSnackbar,
  StyledSnackbarContent,
  SnackbarBackground,
  StyledSnackbarText,
} from '~/ui/global/styled/material-ui'

const IconHolder = styled.span`
  margin-left: 40px;
  margin-top: 8px;
  width: 16px;

  button {
    height: 19px;
    width: 16px;
  }
`

const CloseIconHolder = styled.span`
  margin-left: 60px;
  width: 16px;

  button {
    height: 19px;
    width: 16px;
  }
`

@inject('uiStore', 'apiStore')
@observer
class MoveModal extends React.Component {
  @observable
  isLoading = false

  handleClose = ev => {
    ev.preventDefault()
    const { uiStore } = this.props
    // Notify the user if they're on a different collection
    if (
      uiStore.viewingCollection &&
      uiStore.movingFromCollectionId !== uiStore.viewingCollection.id
    ) {
      if (uiStore.cardAction === 'move') {
        uiStore.alert(
          'Your items have been returned to their original location',
          'Back'
        )
      }
    }
    uiStore.closeMoveMenu()
  }

  moveCards = async placement => {
    const { uiStore, apiStore } = this.props
    const { viewingCollection, cardAction } = uiStore
    // Viewing collection might not be set, such as on the search page
    if (!viewingCollection) {
      uiStore.alert("You can't move an item here")
      return
    }
    const collectionId = viewingCollection.id
    const movingFromCollection = apiStore.find(
      'collections',
      uiStore.movingFromCollectionId
    )
    const error = this.moveErrors({
      viewingCollection,
      movingFromCollection,
      cardAction,
    })
    if (error) {
      if (!viewingCollection.can_edit_content) {
        uiStore.confirm({
          prompt: error,
          confirmText: 'Continue',
          iconName: 'Alert',
          onConfirm: () => {},
          onCancel: () => {
            uiStore.setMovingCards([])
            uiStore.update('selectedCardIds', [])
          },
        })
      } else {
        uiStore.alert(error)
      }
      return
    }
    let data = {
      to_id: collectionId,
      from_id: uiStore.movingFromCollectionId,
      collection_card_ids: uiStore.movingCardIds,
      placement,
    }
    try {
      runInAction(() => {
        this.isLoading = true
      })
      let successMessage
      switch (cardAction) {
        case 'move':
          await apiStore.moveCards(data)
          successMessage = 'Items successfully moved!'
          break
        case 'link':
          await apiStore.linkCards(data)
          successMessage = 'Items successfully linked!'
          break
        case 'duplicate':
          await apiStore.duplicateCards(data)
          successMessage = 'Items successfully duplicated!'
          break
        case 'useTemplate': {
          data = {
            parent_id: data.to_id,
            template_id: data.from_id,
            placement,
          }
          await apiStore.createTemplateInstance(data)
          successMessage = 'Your template instance has been created!'
          break
        }
        default:
          return
      }
      // always refresh the current collection
      // TODO: what if you "moved/duplicated to BOTTOM"?
      await viewingCollection.API_fetchCards()

      runInAction(() => {
        this.isLoading = false
      })
      uiStore.alertOk(successMessage)
      uiStore.resetSelectionAndBCT()
      uiStore.closeMoveMenu()
      if (placement === 'beginning') {
        uiStore.scroll.scrollToTop()
      } else {
        uiStore.scroll.scrollToBottom()
      }
    } catch (e) {
      runInAction(() => {
        this.isLoading = false
      })
      let message = 'You cannot move a collection within itself.'
      if (e && e.error && e.error[0]) {
        message = e.error[0]
      }
      uiStore.alert(message)
    }
  }

  moveErrors = ({ viewingCollection, movingFromCollection, cardAction }) => {
    if (!viewingCollection.can_edit_content) {
      return 'You only have view access to this collection. Would you like to keep moving the cards?'
    } else if (
      // don't allow moving cards from templates to non-templates
      cardAction === 'move' &&
      movingFromCollection &&
      movingFromCollection.isMasterTemplate &&
      !viewingCollection.isMasterTemplate
    ) {
      return "You can't move pinned template items out of a template"
    } else if (
      cardAction === 'useTemplate' &&
      viewingCollection.isMasterTemplate
    ) {
      return "You can't create a template instance inside another template. You may be intending to create or duplicate a master template into here instead."
    } else if (
      viewingCollection.isTestCollection ||
      viewingCollection.isTestDesign
    ) {
      return "You can't move cards into a test collection"
    }
    return ''
  }

  handleMoveToBeginning = () => {
    this.moveCards('beginning')
  }

  handleMoveToEnd = () => {
    this.moveCards('end')
  }

  get moveMessage() {
    const { uiStore } = this.props
    const { cardAction, templateName } = uiStore
    const amount = uiStore.movingCardIds.length
    let message = ''
    if (cardAction === 'move') {
      message = `${amount} in transit`
    } else if (cardAction === 'useTemplate') {
      message = `${templateName} in transit`
    } else {
      message = `${amount} selected to ${cardAction}`
    }
    return message
  }

  get moveHelper() {
    const { uiStore, apiStore } = this.props
    const { cardAction, templateName } = uiStore
    const helperProps = {
      type: 'move',
    }
    if (cardAction === 'useTemplate') {
      if (!apiStore.currentUser.show_template_helper) {
        return null
      }
      helperProps.recordName = templateName
      helperProps.type = 'template'
    } else if (
      !apiStore.currentUser.show_move_helper ||
      uiStore.dismissedMoveHelper
    ) {
      return null
    }
    return (
      <MoveHelperModal currentUser={apiStore.currentUser} {...helperProps} />
    )
  }

  render() {
    const { uiStore } = this.props

    return (
      <div>
        {uiStore.shouldOpenMoveModal && (
          <div>
            <StyledSnackbar classes={{ root: 'Snackbar' }} open>
              {this.isLoading ? (
                <SnackbarBackground>
                  <InlineLoader />
                </SnackbarBackground>
              ) : (
                <StyledSnackbarContent
                  classes={{ root: 'SnackbarContent' }}
                  message={
                    <StyledSnackbarText id="message-id">
                      {this.moveMessage}
                    </StyledSnackbarText>
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
              )}
            </StyledSnackbar>
            {this.moveHelper}
          </div>
        )}
      </div>
    )
  }
}

MoveModal.propTypes = {}
MoveModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
MoveModal.defaultProps = {}

export default MoveModal
