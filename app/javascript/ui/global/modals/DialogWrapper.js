import { Fragment } from 'react'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import {
  StyledSnackbar,
  StyledSnackbarContent,
  StyledSnackbarText,
} from '~/ui/global/styled/material-ui'
import ConfirmationDialog from '~/ui/global/modals/ConfirmationDialog'
import AlertDialog from '~/ui/global/modals/AlertDialog'
import CloseIcon from '~/ui/icons/CloseIcon'

@inject('uiStore')
@observer
class DialogWrapper extends React.Component {
  // This wrapper exists to listen on uiStore for dialogConfig changes
  render() {
    const { uiStore } = this.props
    const { snackbarConfig } = uiStore

    return (
      <Fragment>
        <ConfirmationDialog {...uiStore.dialogConfig} />
        <AlertDialog {...uiStore.dialogConfig} />
        <StyledSnackbar
          {...uiStore.snackbarConfig}
          classes={{ root: 'Snackbar' }}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
        >
          <StyledSnackbarContent
            classes={{ root: 'SnackbarContent autoWidth' }}
            message={
              <StyledSnackbarText>
                {snackbarConfig.message}
              </StyledSnackbarText>
            }
            action={
              <div style={{ height: '19px', width: '16px' }}>
                <button onClick={() => snackbarConfig.onClose()}>
                  <CloseIcon />
                </button>
              </div>
            }
          />

        </StyledSnackbar>
      </Fragment>
    )
  }
}

DialogWrapper.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default DialogWrapper
