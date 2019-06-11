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
    const { apiStore, audience, responseCount } = this.props

    const potentialRespondents = await apiStore.searchForRespondents(
      audience.id,
      responseCount
    )

    this.setState({ potentialRespondents })
  }

  render() {
    const { open, close, audience, responseCount } = this.props
    const { potentialRespondents } = this.state

    return (
      <Modal title="Query the INA" open={open} onClose={close}>
        <div>Audience name: {audience.name}</div>
        <div>Audience id: {audience.id}</div>
        <div>Requested Respondents: {responseCount}</div>
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
  audience: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  responseCount: PropTypes.number.isRequired,
}
AdminNewQueryModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AdminNewQueryModal
