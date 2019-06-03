import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Modal from '~/ui/global/modals/Modal'
import {
  FieldContainer,
  FormActionsContainer,
  FormButton,
  Label,
  TextField,
} from '~/ui/global/styled/forms'

@inject('apiStore')
@observer
class AdminRespondentsModal extends React.Component {
  state = {
    numRespondents: 0,
    potentialRespondents: null,
  }

  componentDidMount() {
    this.setState({ numRespondents: this.props.testAudience.sample_size })
  }

  handleNumRespondentsChange = ev => {
    this.setState({ numRespondents: ev.target.value })
  }

  searchRespondents = async () => {
    const { apiStore, testAudience } = this.props
    const { numRespondents } = this.state

    const potentialRespondents = await apiStore.searchForRespondents(
      testAudience,
      numRespondents
    )
    this.setState({ potentialRespondents })
  }

  render() {
    const { open, close, testAudience } = this.props
    const { numRespondents, potentialRespondents } = this.state

    return (
      <Modal title="Search for Respondents" open={open} onClose={close}>
        <h3>Audience: {testAudience.audience.name}</h3>
        <FieldContainer>
          <Label htmlFor="numRespondents">Number of Respondents</Label>
          <TextField
            id="numRespondents"
            type="text"
            value={numRespondents}
            onChange={this.handleNumRespondentsChange}
          />
        </FieldContainer>
        <FormActionsContainer style={{ paddingBottom: '32px' }}>
          <FormButton
            onClick={this.searchRespondents}
            width={190}
            type="submit"
          >
            Search
          </FormButton>
        </FormActionsContainer>
        {potentialRespondents && (
          <div>Potential Respondents: {potentialRespondents.length}</div>
        )}
      </Modal>
    )
  }
}

AdminRespondentsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  testAudience: MobxPropTypes.objectOrObservableObject.isRequired,
}
AdminRespondentsModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AdminRespondentsModal
