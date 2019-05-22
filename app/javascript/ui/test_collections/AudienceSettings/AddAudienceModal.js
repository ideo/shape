import PropTypes from 'prop-types'

import Modal from '~/ui/global/modals/Modal'
import {
  FormButton,
  FieldContainer,
  FormActionsContainer,
  Label,
  TextField,
} from '~/ui/global/styled/forms'

class AddAudienceModal extends React.Component {
  state = {
    name: '',
    valid: false,
  }

  handleNameChange = ev => {
    this.setState({ name: ev.target.value })
    this.validateForm()
  }

  handleSave = () => {
    console.log('save audience')
  }

  validateForm() {
    const valid = this.state.name.length > 0
    this.setState({ valid })
  }

  render() {
    const { open, close } = this.props

    return (
      <Modal title="Create New Audience" onClose={close} open={open} noScroll>
        <FieldContainer>
          <Label htmlFor="audienceName">Audience Name</Label>
          <TextField
            id="audienceName"
            type="text"
            value={this.state.name}
            onChange={this.handleNameChange}
            placeholder={'enter audience name'}
          />
        </FieldContainer>
        <FormActionsContainer style={{ paddingBottom: '32px' }}>
          <FormButton
            onClick={this.handleSave}
            width={190}
            type="submit"
            disabled={!this.state.valid}
          >
            Submit
          </FormButton>
        </FormActionsContainer>
      </Modal>
    )
  }
}

AddAudienceModal.propTypes = {
  open: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
}

export default AddAudienceModal
