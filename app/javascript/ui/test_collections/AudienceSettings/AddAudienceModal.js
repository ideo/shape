import PropTypes from 'prop-types'
import styled from 'styled-components'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { filter, flatten, includes, remove, forEach } from 'lodash'
import { Flex, Box } from 'reflexbox'
import { Grid } from '@material-ui/core'
import googleTagManager from '~/vendor/googleTagManager'

import Audience from '~/stores/jsonApi/Audience'
import Button from '~shared/components/atoms/Button'
import EditPencilIcon from '~/ui/icons/EditPencilIcon'
import HorizontalDivider from '~shared/components/atoms/HorizontalDivider'
import Modal from '~/ui/global/modals/Modal'
import PlusIcon from '~/ui/icons/PlusIcon'
import TrashIcon from '~/ui/icons/TrashIcon'
import v, { TARGETED_AUDIENCE_PRICE_PER_RESPONSE } from '~/utils/variables'
import {
  groupCriteriaByGroup,
  getCriterionByName,
  criteriaLimitByGroup,
} from '~/ui/test_collections/AudienceSettings/AudienceCriteria'
import { FormButton, TextButton } from '~/ui/global/styled/buttons'
import {
  Checkbox,
  CheckboxSelectOption,
  FieldContainer,
  Label,
  Select,
  SelectOption,
  TextField,
} from '~/ui/global/styled/forms'
import {
  Heading3,
  DisplayText,
  SmallHelperText,
} from '~/ui/global/styled/typography'
import { FloatRight } from '~/ui/global/styled/layout'

const ROOT_MENU = 'root'

const StyledPlusIcon = styled.span`
  height: 15px;
  margin-right: 8px;
  width: 15px;
`

const EditButton = styled.button`
  height: 22px;
  width: 22px;
  margin-right: 6px;
`
EditButton.displayName = 'EditButton'

const DeleteButton = styled.button`
  height: 22px;
  width: 27px;
`
DeleteButton.displayName = 'DeleteButton'

const SelectedOptionsWrapper = styled(Flex)`
  min-height: 40px;
`

const SelectedOption = styled.span`
  background: ${v.colors.commonLightest};
  font-family: ${v.fonts.sans};
  margin-bottom: 8px;
  margin-right: 8px;
  padding: 8px 12px;
`
SelectedOption.displayName = 'SelectedOption'

const UnderlineLink = styled.div`
  text-decoration: underline;
  cursor: pointer;
  display: inline;
  margin-left: 4px;
  margin-right: 4px;
`

@inject('apiStore')
@observer
class AddAudienceModal extends React.Component {
  state = {
    name: '',
    valid: false,
    selectedCriteria: [],
    numCriteriaPerGroup: {},
    openMenus: {},
    age_list: [],
    children_age_list: [],
    country_list: [],
    education_level_list: [],
    gender_list: [],
    adopter_type_list: [],
    interest_list: [],
    publication_list: [],
  }

  criteriaTriggers = {}

  openMenu = menu => {
    const { openMenus } = this.state
    openMenus[menu] = true

    this.setState({ openMenus })
  }

  updateMenuPosition = (menu, ref) => {
    const criteriaTrigger = this.criteriaTriggers[menu]
    if (!criteriaTrigger || !ref) return

    const triggerPosition = criteriaTrigger.getBoundingClientRect()
    const { top, left, height } = triggerPosition
    const menuTop = top + height

    const baseStyle = 'position: fixed; z-index: 1400;'
    ref.style = `${baseStyle} top: ${menuTop}px; left: ${left}px;`
  }

  closeMenu = menu => {
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
    const {
      name,
      age_list,
      children_age_list,
      country_list,
      education_level_list,
      gender_list,
      adopter_type_list,
      interest_list,
      publication_list,
    } = this.state

    const audience = new Audience(
      {
        name,
        age_list,
        children_age_list,
        country_list,
        education_level_list,
        gender_list,
        adopter_type_list,
        interest_list,
        publication_list,
      },
      apiStore
    )
    const createAudience = await audience.API_create()

    if (createAudience) this.trackAudienceCreation()

    this.props.afterSave(audience)

    this.reset()
  }

  trackAudienceCreation = () => {
    googleTagManager.push({
      event: 'formSubmission',
      formType: 'Create Audience',
    })
  }

  handleShowSupportWidget = () => {
    const { zE } = window
    zE('webWidget', 'show')
    zE('webWidget', 'open')
  }

  reset = () => {
    this.props.close()
    this.setState({
      name: '',
      valid: false,
      selectedCriteria: [],
      numCriteriaPerGroup: {},
      openMenus: {},
      age_list: [],
      children_age_list: [],
      country_list: [],
      education_level_list: [],
      gender_list: [],
      adopter_type_list: [],
      interest_list: [],
      publication_list: [],
    })
  }

  addCriteria = e => {
    const criteria = e.target.value[0]
    if (!criteria) return

    const { selectedCriteria } = this.state

    selectedCriteria.push(criteria)
    this.setState({ selectedCriteria })

    this.closeMenu(ROOT_MENU)
    this.openMenu(criteria)
  }

  removeCriteria(criteria) {
    const { numCriteriaPerGroup, selectedCriteria } = this.state

    remove(selectedCriteria, c => c === criteria)

    const { tagList, group } = getCriterionByName(criteria)
    numCriteriaPerGroup[group] -= 1

    this.setState({
      selectedCriteria,
      numCriteriaPerGroup,
      [tagList]: [],
    })
  }

  toggleCriteriaOption = (e, criteria) => {
    const { numCriteriaPerGroup } = this.state

    const { tagList, group } = getCriterionByName(criteria)
    const selectedCriteriaOptions = this.state[tagList]

    if (!numCriteriaPerGroup[group]) numCriteriaPerGroup[group] = 0

    e.target.value.forEach(value => {
      if (includes(selectedCriteriaOptions, value)) {
        remove(selectedCriteriaOptions, o => o === value)
        numCriteriaPerGroup[group] -= 1
      } else {
        selectedCriteriaOptions.push(value)
        numCriteriaPerGroup[group] += 1
      }
    })

    this.setState({ [tagList]: selectedCriteriaOptions, numCriteriaPerGroup })
  }

  get reachedCriteriaLimit() {
    const { numCriteriaPerGroup } = this.state

    if (!criteriaLimitByGroup) return false

    let overLimit = false

    forEach(criteriaLimitByGroup, (limit, group) => {
      if (numCriteriaPerGroup[group] > limit) {
        overLimit = true
      }
    })

    return overLimit
  }

  validateForm() {
    const valid = this.state.name.length > 0
    this.setState({ valid })
  }

  renderCriteriaMenu() {
    const { openMenus, selectedCriteria } = this.state

    // Since the menu is displayed in a MUI dialog, it must be
    // rendered after the add audience modal is opened.
    // Otherwise, it is replaced by the add audience modal
    const menuOpen = openMenus[ROOT_MENU]
    if (!menuOpen) return null

    const criteria = groupCriteriaByGroup()
    const groups = criteria.map(([group, groupCriteria]) => {
      const groupOption = (
        <SelectOption
          key={group}
          classes={{ root: 'category' }}
          disabled={true}
        >
          {group}
        </SelectOption>
      )

      const options = groupCriteria.map(({ name }) => (
        <SelectOption
          key={name}
          classes={{ root: 'selectOption' }}
          disabled={includes(selectedCriteria, name)}
          value={name}
        >
          {name}
        </SelectOption>
      ))

      return [groupOption, ...options]
    })

    return this.renderSelectMenu({
      isOpen: menuOpen,
      menuId: ROOT_MENU,
      onChange: this.addCriteria,
      selectOptions: flatten(groups),
    })
  }

  renderSelectMenu({ isOpen, menuId, onChange, selectOptions }) {
    return (
      <div key={menuId} ref={ref => this.updateMenuPosition(menuId, ref)}>
        <Select
          open={isOpen}
          onOpen={() => this.openMenu(menuId)}
          onClose={() => this.closeMenu(menuId)}
          onChange={onChange}
          MenuProps={{ style: { maxHeight: '366px' } }}
          multiple
          value={[]}
          style={{ visibility: 'hidden', width: 0, height: 0 }}
        >
          {selectOptions}
        </Select>
      </div>
    )
  }

  renderSelectedCriteria() {
    const { numCriteriaPerGroup } = this.state

    return this.state.selectedCriteria.map(criteria => {
      const { options, group, tagList } = getCriterionByName(criteria)
      const selectedCriteriaOptions = this.state[tagList]

      const selectedOptions = filter(selectedCriteriaOptions, o =>
        includes(options, o)
      )
      const isLimited = criteriaLimitByGroup[group]
      const atLimit = numCriteriaPerGroup[group] > criteriaLimitByGroup[group]
      return (
        <FieldContainer key={`menu_${criteria}`}>
          <FloatRight>
            <EditButton onClick={() => this.openMenu(criteria)}>
              <EditPencilIcon />
            </EditButton>
            <DeleteButton onClick={() => this.removeCriteria(criteria)}>
              <TrashIcon />
            </DeleteButton>
          </FloatRight>
          <span ref={ref => (this.criteriaTriggers[criteria] = ref)}>
            <Label>{criteria}</Label>
            {isLimited && (
              <Box mt={-14} mb={14}>
                <SmallHelperText
                  style={{
                    color: atLimit ? v.colors.alert : v.colors.commonMedium,
                  }}
                >
                  Audiences are limited to a total of two (2) interests or
                  publications.
                </SmallHelperText>
              </Box>
            )}
          </span>
          <SelectedOptionsWrapper wrap>
            {selectedOptions.map(option => (
              <SelectedOption key={`selected_${option}`}>
                {option}
              </SelectedOption>
            ))}
          </SelectedOptionsWrapper>
          <HorizontalDivider
            color={v.colors.commonMedium}
            style={{ borderWidth: '0 0 1px 0', marginBlockStart: 0 }}
          />
        </FieldContainer>
      )
    })
  }

  renderSelectedCriteriaMenus() {
    const { selectedCriteria, openMenus } = this.state

    return selectedCriteria.map(criteria => {
      const { options: availableOptions, tagList } = getCriterionByName(
        criteria
      )
      const selectedCriteriaOptions = this.state[tagList]

      const options = availableOptions.map(option => {
        return (
          <CheckboxSelectOption
            key={option}
            classes={{ root: 'selectOption' }}
            value={option}
          >
            <Checkbox checked={includes(selectedCriteriaOptions, option)} />
            {option}
          </CheckboxSelectOption>
        )
      })
      const menuOpen = openMenus[criteria]
      return this.renderSelectMenu({
        isOpen: menuOpen,
        menuId: criteria,
        onChange: e => this.toggleCriteriaOption(e, criteria),
        selectOptions: options,
      })
    })
  }

  get allSelectedCriteriaOptions() {
    const stateListKeys = filter(Object.keys(this.state), k =>
      includes(k, '_list')
    )
    return flatten(stateListKeys.map(k => this.state[k]))
  }

  render() {
    const numSelectedOptions = this.allSelectedCriteriaOptions.length

    return (
      <React.Fragment>
        <Modal
          title="Create New Audience"
          onClose={this.reset}
          open={this.props.open}
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
          <Box mb={2}>
            <Label>Targeting Criteria</Label>
          </Box>
          {this.renderSelectedCriteria()}
          <Box mb={3}>
            <div ref={ref => (this.criteriaTriggers[ROOT_MENU] = ref)}>
              <Button href="#" onClick={() => this.openMenu(ROOT_MENU)}>
                <StyledPlusIcon>
                  <PlusIcon />
                </StyledPlusIcon>
                Add Audience Criteria
              </Button>
            </div>
            <HorizontalDivider
              color={v.colors.commonMedium}
              style={{ borderWidth: '0 0 1px 0' }}
            />
          </Box>
          <Box mt={1} mb={25}>
            <Heading3>Need help with your audience?</Heading3>
            <DisplayText>
              Want to include unavailable criteria or add more interests? We're
              happy to help you create the audience you need.
              <UnderlineLink onClick={this.handleShowSupportWidget}>
                Submit a request
              </UnderlineLink>
              and we’ll get back to you in 24 hours.
            </DisplayText>
          </Box>
          <Box mt={2} mb={35}>
            <DisplayText>
              The default price per respondent for a custom audience is $
              {TARGETED_AUDIENCE_PRICE_PER_RESPONSE.toFixed(2)}.
            </DisplayText>
          </Box>
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
                  disabled={
                    !this.state.valid ||
                    this.reachedCriteriaLimit ||
                    numSelectedOptions === 0
                  }
                >
                  Save
                </FormButton>
              </Grid>
            </Grid>
          </Grid>
        </Modal>
        {this.renderCriteriaMenu()}
        {this.renderSelectedCriteriaMenus()}
      </React.Fragment>
    )
  }
}

AddAudienceModal.propTypes = {
  open: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  afterSave: PropTypes.func,
}
AddAudienceModal.defaultProps = {
  afterSave: () => {},
}
AddAudienceModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AddAudienceModal
