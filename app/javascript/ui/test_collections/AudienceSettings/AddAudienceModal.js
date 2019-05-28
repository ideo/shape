import PropTypes from 'prop-types'
import styled from 'styled-components'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { includes, remove } from 'lodash'
import { Collapse } from '@material-ui/core'
import { Grid } from '@material-ui/core'

import Audience from '~/stores/jsonApi/Audience'
import { criteria, criteriaOptions } from './AudienceCriteria'
import Button from '~shared/components/atoms/Button'
import EditPencilIcon from '~/ui/icons/EditPencilIcon'
import HorizontalDivider from '~shared/components/atoms/HorizontalDivider'
import Modal from '~/ui/global/modals/Modal'
import PlusIcon from '~shared/images/icon-plus.svg'
import TrashLgIcon from '~/ui/icons/TrashLgIcon'
import v from '~/utils/variables'
import { FloatRight } from '~/ui/global/styled/layout'
import {
  Checkbox,
  CheckboxSelectOption,
  FormButton,
  FieldContainer,
  Label,
  Select,
  SelectOption,
  TextButton,
  TextField,
} from '~/ui/global/styled/forms'
import TrashIcon from '~/ui/icons/TrashIcon';

const AddCriteriaMenu = styled.ul`
  background: ${v.colors.white};
  max-height: 264px;
  overflow-y: scroll;
  width: 250px;
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

const EditButton = styled.button`
  height: 22px;
  width: 22px;
`

const DeleteButton = styled.button`
  height: 22px;
  width: 27px;
`

@inject('apiStore')
@observer
class AddAudienceModal extends React.Component {
  state = {
    name: '',
    valid: false,
    criteriaMenuOpen: false,
    selectedCriteria: [],
    openMenus: {},
  }

  addCriteraButton = null
  criteriaMenu = null
  criteriaTriggers = {}

  closeModal = () => {
    this.closeCriteriaMenu()
    this.props.close()
  }

  closeCriteriaMenu = () => {
    this.setState({ criteriaMenuOpen: false })
  }

  toggleCriteriaMenu = () => {
    this.updateCriteriaMenuPosition()
    this.setState({ criteriaMenuOpen: !this.state.criteriaMenuOpen })
  }

  updateCriteriaMenuPosition = () => {
    if (!this.addCriteraButton || !this.criteriaMenu) return

    const buttonPosition = this.addCriteraButton.getBoundingClientRect()
    const top = buttonPosition.top + buttonPosition.height + 8
    const left = buttonPosition.left + 22

    const baseStyle = 'position: fixed; z-index: 1400; box-shadow: 0 0 8px 0 rgba(18,15,14,0.2);'
    this.criteriaMenu.style = `${baseStyle} top: ${top}px; left: ${left}px;`
  }

  openMenu = (menu) => {
    const { openMenus } = this.state
    openMenus[menu] = true

    this.setState({ openMenus })
  }

  updateMenuPosition = (menu, ref) => {
    const criteriaTrigger = this.criteriaTriggers[menu]
    if (!criteriaTrigger) return

    const triggerPosition = criteriaTrigger.getBoundingClientRect()
    const top = triggerPosition.top + triggerPosition.height - 24
    const left = triggerPosition.left

    const baseStyle = 'position: fixed; z-index: 1400;'
    ref.style = `${baseStyle} top: ${top}px; left: ${left}px;`
  }

  closeMenu = (menu) => {
    const { openMenus } = this.state
    openMenus[menu] = false

    this.setState({ openMenus })
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

  addCriteria(criteria) {
    const { selectedCriteria } = this.state
    selectedCriteria.push(criteria)
    this.setState({ selectedCriteria })

    this.closeCriteriaMenu()
    this.openMenu(criteria)
  }

  removeCriteria(criteria) {
    const { selectedCriteria } = this.state
    remove(selectedCriteria, c => c === criteria)
    this.setState({ selectedCriteria })
  }

  validateForm() {
    const valid = this.state.name.length > 0
    this.setState({ valid })
  }

  renderCriteriaMenu() {
    const { selectedCriteria } = this.state

    const groups = Object.keys(criteria).map(group => {
      const options = criteria[group].map(option => {
        const { name } = option

        return (
        <SelectOption
          key={name}
          classes={{ root: 'selectOption' }}
          disabled={includes(selectedCriteria, name)}
          onClick={() => this.addCriteria(name)}
        >
          {name}
        </SelectOption>
        )
      })

      return (
        <React.Fragment key={group}>
          <CriteriaGroup>{group}</CriteriaGroup>
          {options}
        </React.Fragment>
      )
    })

    return <AddCriteriaMenu>{groups}</AddCriteriaMenu>
  }

  renderSelectedCriteria() {
    return this.state.selectedCriteria.map(criteria => (
      <div ref={ref => this.criteriaTriggers[criteria] = ref}>
        <FieldContainer key={criteria}>
          <FloatRight>
            <EditButton onClick={() => this.openMenu(criteria)}>
              <EditPencilIcon />
            </EditButton>
            <DeleteButton onClick={() => this.removeCriteria(criteria)}>
              <TrashIcon />
            </DeleteButton>
          </FloatRight>
          <Label>{criteria}</Label>
          <HorizontalDivider
            color={v.colors.commonMedium}
            style={{ borderWidth: '0 0 1px 0' }}
          />
        </FieldContainer>
      </div>
    ))
  }

  renderSelectedCriteriaMenus() {
    const { selectedCriteria, openMenus } = this.state

    return selectedCriteria.map(criteria => {
      const options = criteriaOptions[criteria].options.map(option => (
        <CheckboxSelectOption
          key={option}
          classes={{ root: 'selectOption' }}
        >
          <Checkbox checked={false} />
          {option}
        </CheckboxSelectOption>
      ))

      const menuOpen = openMenus[criteria]

      return (
        <div key={criteria} ref={ref => this.updateMenuPosition(criteria, ref)}>
          <Collapse in={menuOpen} timeout="auto" unmountOnExit>
            <Select
              open={menuOpen}
              onOpen={() => this.openMenu(criteria)}
              onClose={() => this.closeMenu(criteria)}
              MenuProps={{ style: { maxHeight: '366px' }}}
              multiple
              value={[]}
              style={{ visibility: 'hidden'}}
            >
              {options}
            </Select>
          </Collapse>
        </div>
      )
    })
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
          {this.renderSelectedCriteria()}
          <FieldContainer>
            <Label>Targeting Criteria</Label>
            <div ref={ref => this.addCriteraButton = ref}>
              <Button href="#" onClick={this.toggleCriteriaMenu}>
                <PlusIcon width={15} style={{ fill: v.colors.black }} />
                Add Audience Criteria
              </Button>
            </div>
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
        <div ref={ref => this.criteriaMenu = ref}>
          <Collapse in={this.state.criteriaMenuOpen} timeout="auto" unmountOnExit>
            {this.renderCriteriaMenu()}
          </Collapse>
        </div>
        {this.renderSelectedCriteriaMenus()}
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
