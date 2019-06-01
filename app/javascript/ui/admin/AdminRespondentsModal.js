import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import Modal from '~/ui/global/modals/Modal'
import {
  FieldContainer,
  FormActionsContainer,
  FormButton,
  Label,
  TextField,
} from '~/ui/global/styled/forms'

class AdminRespondentsModal extends React.Component {
  state = {
    numRespondents: 0,
  }

  componentDidMount() {
    this.setState({ numRespondents: this.props.testAudience.sample_size })
  }

  handleNumRespondentsChange = ev => {
    this.setState({ numRespondents: ev.target.value })
  }

  searchRespondents = () => {
    console.log('searchRespondents', this.state.numRespondents)
  }

  render() {
    const { open, close, testAudience } = this.props

    return (
      <Modal title="Search for Respondents" open={open} onClose={close}>
        <h3>Audience: {testAudience.audience.name}</h3>
        <FieldContainer>
          <Label htmlFor="numRespondents">Number of Respondents</Label>
          <TextField
            id="numRespondents"
            type="text"
            value={this.state.numRespondents}
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
      </Modal>
    )
  }
}

AdminRespondentsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  testAudience: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AdminRespondentsModal
