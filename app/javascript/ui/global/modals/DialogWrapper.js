import { Fragment } from 'react'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import ConfirmationDialog from '~/ui/global/modals/ConfirmationDialog'
import AlertDialog from '~/ui/global/modals/AlertDialog'

@inject('uiStore')
@observer
class DialogWrapper extends React.Component {
  // This wrapper exists to listen on uiStore for dialogConfig changes
  render() {
    const { uiStore } = this.props
    return (
      <Fragment>
        <ConfirmationDialog {...uiStore.dialogConfig} />
        <AlertDialog {...uiStore.dialogConfig} />
      </Fragment>
    )
  }
}

DialogWrapper.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default DialogWrapper
