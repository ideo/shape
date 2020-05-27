import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import CloseIcon from '~/ui/icons/CloseIcon'
import InlineLoader from '~/ui/layout/InlineLoader'
import MoveArrowIcon from '~/ui/icons/MoveArrowIcon'
import Tooltip from '~/ui/global/Tooltip'
import CardMoveService from '~/utils/CardMoveService'

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
class MoveSnackbar extends React.Component {
  componentDidUpdate() {
    const { uiStore, pastingCards } = this.props
    if (pastingCards) {
      this.handleMoveToEnd()
      uiStore.update('pastingCards', false)
    }
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
            data-cy="MoveSnackbarArrow-up"
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
          <button
            onClick={this.handleMoveToEnd}
            data-cy="MoveSnackbarArrow-down"
          >
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

  get snackbarActions() {
    return [
      this.upArrowIconHolder,
      this.downArrowIconHolder,
      this.closeIconHolder,
    ].filter(el => !null)
  }

  render() {
    const { uiStore } = this.props
    return (
      <StyledSnackbar classes={{ root: 'Snackbar' }} placement={'bottom'} open>
        {uiStore.isLoadingMoveAction ? (
          <SnackbarBackground>
            <InlineLoader />
          </SnackbarBackground>
        ) : (
          <Fragment>
            <StyledSnackbarContent
              classes={{ root: 'SnackbarContent' }}
              message={
                <StyledSnackbarText id="message-id" data-cy="snackbar-message">
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
}

MoveSnackbar.propTypes = {
  pastingCards: PropTypes.bool.isRequired,
}
MoveSnackbar.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
MoveSnackbar.defaultProps = {
  pastingCards: false,
}

export default MoveSnackbar
