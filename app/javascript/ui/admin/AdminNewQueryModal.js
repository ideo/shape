import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Modal from '~/ui/global/modals/Modal'

@inject('apiStore')
@observer
class AdminNewQueryModal extends React.Component {
  state = {
    potentialRespondents: null,
  }

  componentDidMount() {
    this.searchRespondents()
  }

  async searchRespondents() {
    const { apiStore, testAudience } = this.props

    const potentialRespondents = await apiStore.searchForRespondents(
      testAudience,
      testAudience.sample_size
    )

    this.setState({ potentialRespondents })
  }

  render() {
    const { open, close, requestedResponseCount } = this.props
    const { potentialRespondents } = this.state

    return (
      <Modal title="Query the INA" open={open} onClose={close}>
        <div>Requested Respondents: {requestedResponseCount}</div>
        {potentialRespondents != null ? (
          <div>Sourced Respondents: {potentialRespondents.length}</div>
        ) : (
          <div>Loading...</div>
        )}
      </Modal>
    )
  }
}

AdminNewQueryModal.propTypes = {
  open: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  testAudience: MobxPropTypes.objectOrObservableObject.isRequired,
  requestedResponseCount: PropTypes.number.isRequired,
}
AdminNewQueryModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AdminNewQueryModal
