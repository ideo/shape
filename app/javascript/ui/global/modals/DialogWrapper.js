import _ from 'lodash'
import { Fragment } from 'react'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import {
  StyledSnackbar,
  StyledSnackbarContent,
  StyledSnackbarText,
} from '~/ui/global/styled/material-ui'
import AlertDialog from '~/ui/global/modals/AlertDialog'
import ConfirmationDialog from '~/ui/global/modals/ConfirmationDialog'
import LoadingDialog from '~/ui/global/modals/LoadingDialog'
import CloseIcon from '~/ui/icons/CloseIcon'
import v from '~/utils/variables'

// This wrapper exists to listen on uiStore for dialogConfig changes
@inject('uiStore')
@observer
class DialogWrapper extends React.Component {
  snackbarAction() {
    const { uiStore } = this.props
    const { onClose, showRefresh } = uiStore.snackbarConfig

    const reloadPage = () => {
      window.location.reload()
    }

    let button = (
      <button onClick={onClose} style={{ height: '19px', width: '16px' }}>
        <CloseIcon />
      </button>
    )
    if (showRefresh) {
      button = (
        <button
          style={{ fontFamily: v.fonts.sans, fontSize: '0.8rem' }}
          onClick={reloadPage}
        >
          Reload page
        </button>
      )
    }
    return <div style={{ height: '19px', minWidth: '16px' }}>{button}</div>
  }

  renderSnackbar() {
    const { uiStore } = this.props
    const {
      message,
      onClose,
      autoHideDuration,
      open,
      backgroundColor,
    } = uiStore.snackbarConfig

    let snackbarMessage = ''
    if (_.isString(message)) {
      snackbarMessage = <StyledSnackbarText>{message}</StyledSnackbarText>
    }

    return (
      <StyledSnackbar
        onClose={onClose}
        autoHideDuration={autoHideDuration}
        // disableWindowBlurListener allows snackbar to hide even if window loses focus
        // https://github.com/mui-org/material-ui/issues/10381
        disableWindowBlurListener
        open={open}
        classes={{ root: 'Snackbar' }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        placement={'top'}
      >
        <StyledSnackbarContent
          classes={{ root: `SnackbarContent autoWidth` }}
          backgroundColor={backgroundColor}
          message={snackbarMessage}
          action={this.snackbarAction()}
        />
      </StyledSnackbar>
    )
  }

  render() {
    const { uiStore } = this.props
    return (
      <Fragment>
        <ConfirmationDialog {...uiStore.dialogConfig} />
        <AlertDialog {...uiStore.dialogConfig} />
        <LoadingDialog {...uiStore.dialogConfig} />
        {this.renderSnackbar()}
      </Fragment>
    )
  }
}

DialogWrapper.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default DialogWrapper
