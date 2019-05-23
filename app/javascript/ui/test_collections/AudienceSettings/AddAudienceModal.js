import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Grid } from '@material-ui/core'

import Modal from '~/ui/global/modals/Modal'
import {
  FormButton,
  FieldContainer,
  Label,
  TextButton,
  TextField,
} from '~/ui/global/styled/forms'
import Audience from '~/stores/jsonApi/Audience'

@inject('apiStore')
@observer
class AddAudienceModal extends React.Component {
  state = {
    name: '',
    valid: false,
  }

  handleNameChange = ev => {
    this.setState({ name: ev.target.value })
    this.validateForm()
  }

  handleSave = async () => {
    const { apiStore } = this.props

    const audience = new Audience({ name: this.state.name }, apiStore)
    await audience.API_create()

    this.reset()
  }

  reset = () => {
    this.props.close()
    this.setState({ name: '', valid: false })
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
            placeholder={'Enter Audience Name…'}
          />
        </FieldContainer>
        <Grid container alignItems="center" style={{ paddingBottom: '32px' }}>
          <Grid item xs={6}>
            <Grid container justify="center">
              <TextButton onClick={this.reset} width={190}>
                Cancel
              </TextButton>
            </Grid>
          </Grid>
          <Grid item xs={6}>
            <Grid container justify="center">
              <FormButton
                onClick={this.handleSave}
                width={190}
                type="submit"
                disabled={!this.state.valid}
              >
                Save
              </FormButton>
            </Grid>
          </Grid>
        </Grid>
      </Modal>
    )
  }
}

AddAudienceModal.propTypes = {
  open: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
}
AddAudienceModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AddAudienceModal
