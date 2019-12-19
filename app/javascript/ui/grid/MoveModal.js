import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import CloseIcon from '~/ui/icons/CloseIcon'
import InlineLoader from '~/ui/layout/InlineLoader'
import MoveArrowIcon from '~/ui/icons/MoveArrowIcon'
import MoveHelperModal from '~/ui/users/MoveHelperModal'
import Tooltip from '~/ui/global/Tooltip'
import CardMoveService from '~/ui/grid/CardMoveService'

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
  componentDidUpdate() {
    const { uiStore, pastingCards } = this.props
    if (pastingCards) {
      this.handleMoveToEnd()
      uiStore.update('pastingCards', false)
    }
    const hideDraggableCard = hidden => {
      // HACK: selects movingCardId when template helper modal is active is active then hides it
      const templateCardId = uiStore.movingCardIds[0]
      const selectedCardIdElement = document.getElementById(
        `gridCard-${templateCardId}-mdlPlaceholder`
      )
      const selectedDraggableElement = selectedCardIdElement.closest(
        '.react-draggable'
      )
      if (selectedCardIdElement && selectedDraggableElement) {
        if (hidden) {
          selectedDraggableElement.style.visibility = 'hidden'
        } else {
          selectedDraggableElement.style.visibility = 'visible'
        }
      }
    }
    if (this.templateHelperModalActive) {
      setTimeout(() => {
        hideDraggableCard(true)
      }, 100)
    } else {
      hideDraggableCard(false)
    }
  }

  get templateHelperModalActive() {
    const { uiStore, apiStore } = this.props
    return (
      uiStore.cardAction === 'useTemplate' &&
      apiStore.currentUser.show_template_helper &&
      !uiStore.dismissedMoveHelper
    )
  }

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

  handleMoveToBeginning = () => {
    CardMoveService.moveCards('beginning')
  }

  handleMoveToEnd = () => {
    CardMoveService.moveCards('end')
  }

  get moveMessage() {
    const { uiStore } = this.props
    const { cardAction } = uiStore
    let { templateName } = uiStore
    if (templateName && templateName.length > 25) {
      templateName = templateName.slice(0, 22) + '...'
    }
    const amount = uiStore.movingCardIds.length
    const cardsString = amount > 1 ? `cards` : `card`
    let message = ''
    if (cardAction === 'move') {
      message = `${amount} ${cardsString} in transit`
    } else if (cardAction === 'useTemplate') {
      message = `${templateName} in transit`
    } else {
      message = `${amount} ${cardsString} selected to ${cardAction}`
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

  get moveTemplateHelper() {
    const { uiStore, apiStore } = this.props
    const { templateName } = uiStore
    const helperProps = {
      type: 'template',
      recordName: templateName,
    }
    return (
      <MoveHelperModal currentUser={apiStore.currentUser} {...helperProps} />
    )
  }

  get upArrowIconHolder() {
    const { uiStore } = this.props
    const { viewingCollection } = uiStore

    if (viewingCollection && viewingCollection.isBoard) return null

    return (
      <IconHolder key="moveup">
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title="Place at top"
          placement="top"
        >
          <button
            onClick={this.handleMoveToBeginning}
            data-cy="MoveModalArrow-up"
          >
            <MoveArrowIcon direction="up" />
          </button>
        </Tooltip>
      </IconHolder>
    )
  }

  get downArrowIconHolder() {
    return (
      <IconHolder key="movedown">
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title="Place at bottom"
          placement="top"
        >
          <button onClick={this.handleMoveToEnd} data-cy="MoveModalArrow-down">
            <MoveArrowIcon direction="down" />
          </button>
        </Tooltip>
      </IconHolder>
    )
  }

  get closeIconHolder() {
    return (
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
      </CloseIconHolder>
    )
  }

  get moveSnackbar() {
    const { uiStore } = this.props
    return (
      <StyledSnackbar classes={{ root: 'Snackbar' }} open>
        {uiStore.isLoadingMoveAction ? (
          <SnackbarBackground>
            <InlineLoader />
          </SnackbarBackground>
        ) : (
          <Fragment>
            <StyledSnackbarContent
              classes={{ root: 'SnackbarContent' }}
              message={
                <StyledSnackbarText id="message-id">
                  {this.moveMessage}
                </StyledSnackbarText>
              }
              action={this.snackbarActions}
            />
          </Fragment>
        )}
      </StyledSnackbar>
    )
  }

  get snackbarActions() {
    return [
      this.upArrowIconHolder,
      this.downArrowIconHolder,
      this.closeIconHolder,
    ].filter(el => !null)
  }

  render() {
    const { uiStore } = this.props
    if (!uiStore.shouldOpenMoveModal) return null
    return (
      <div>
        {!this.templateHelperModalActive && this.moveSnackbar}
        {this.moveHelper}
      </div>
    )
  }
}

MoveModal.propTypes = {
  pastingCards: PropTypes.bool.isRequired,
}
MoveModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
MoveModal.defaultProps = {
  pastingCards: false,
}

export default MoveModal
