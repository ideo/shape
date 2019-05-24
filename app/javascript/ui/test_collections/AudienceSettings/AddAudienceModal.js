import PropTypes from 'prop-types'
import styled from 'styled-components'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { Collapse } from '@material-ui/core'
import { Grid } from '@material-ui/core'

import Audience from '~/stores/jsonApi/Audience'
import Button from '~shared/components/atoms/Button'
import HorizontalDivider from '~shared/components/atoms/HorizontalDivider'
import Modal from '~/ui/global/modals/Modal'
import PlusIcon from '~shared/images/icon-plus.svg'
import v from '~/utils/variables'
import {
  FormButton,
  FieldContainer,
  Label,
  SelectOption,
  TextButton,
  TextField,
} from '~/ui/global/styled/forms'

// TODO Position menu on all viewport sizes
const AddCriteriaMenu = styled.ul`
  background: ${v.colors.white};
  box-shadow: 0 0 8px 0 rgba(18,15,14,0.2);
  left: calc(50% - 300px);
  position: fixed;
  top: calc(50% + 73px);
  width: 250px;
  z-index: 1500;gg
`

const CriteriaGroup = styled.li`
  border-top: 1px solid ${v.colors.black};
  font-size: 0.8125rem;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.medium};
  letter-spacing: 1px;
  padding: 12px 10px 12px 20px;
  text-transform: uppercase;
`

@inject('apiStore')
@observer
class AddAudienceModal extends React.Component {
  state = {
    name: '',
    valid: false,
    criteriaMenuOpen: false,
  }

  closeModal = () => {
    this.closeCriteriaMenu()
    this.props.close()
  }

  closeCriteriaMenu = () => {
    this.setState({ criteriaMenuOpen: false })
  }

  toggleCriteriaMenu = () => {
    this.setState({ criteriaMenuOpen: !this.state.criteriaMenuOpen })
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
    return (
      <React.Fragment>
        <Modal
          title="Create New Audience"
          onClose={this.closeModal}
          open={this.props.open}
          noScroll
        >
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
          <FieldContainer>
            <Label>Targeting Criteria</Label>
            <Button href="#" onClick={this.toggleCriteriaMenu}>
              <PlusIcon width={15} style={{ fill: v.colors.black }} />
              Add Audience Criteria
            </Button>
            <HorizontalDivider
              color={v.colors.commonMedium}
              style={{ borderWidth: '0 0 1px 0' }}
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
        <Collapse in={this.state.criteriaMenuOpen} timeout="auto" unmountOnExit>
          <AddCriteriaMenu>
            <CriteriaGroup>Demographics</CriteriaGroup>
            <SelectOption classes={{ root: 'selectOption' }}>Age</SelectOption>
            <SelectOption classes={{ root: 'selectOption' }}>
              Children
            </SelectOption>
            <SelectOption classes={{ root: 'selectOption' }}>
              Country
            </SelectOption>
          </AddCriteriaMenu>
        </Collapse>
      </React.Fragment>
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
