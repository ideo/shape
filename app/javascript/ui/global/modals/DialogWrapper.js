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

// This wrapper exists to listen on uiStore for dialogConfig changes
@inject('uiStore')
@observer
class DialogWrapper extends React.Component {
  renderSnackbar() {
    const { uiStore } = this.props
    const { message, onClose, autoHideDuration, open } = uiStore.snackbarConfig
    return (
      <StyledSnackbar
        onClose={onClose}
        autoHideDuration={autoHideDuration}
        open={open}
        classes={{ root: 'Snackbar' }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <StyledSnackbarContent
          classes={{ root: 'SnackbarContent autoWidth' }}
          message={<StyledSnackbarText>{message}</StyledSnackbarText>}
          action={
            <div style={{ height: '19px', width: '16px' }}>
              <button onClick={() => onClose()}>
                <CloseIcon />
              </button>
            </div>
          }
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
