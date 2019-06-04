import PropTypes from 'prop-types'
import styled from 'styled-components'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { filter, flatten, includes, remove, forEach } from 'lodash'
import { Flex, Box } from 'reflexbox'
import { Grid } from '@material-ui/core'

import Audience from '~/stores/jsonApi/Audience'
import Button from '~shared/components/atoms/Button'
import EditPencilIcon from '~/ui/icons/EditPencilIcon'
import HorizontalDivider from '~shared/components/atoms/HorizontalDivider'
import Modal from '~/ui/global/modals/Modal'
import PlusIcon from '~/ui/icons/PlusIcon'
import TrashIcon from '~/ui/icons/TrashIcon'
import v from '~/utils/variables'
import {
  groupCriteriaByGroup,
  getCriterionByName,
  criteriaLimitByGroup,
} from './AudienceCriteria'
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
    selectedCriteriaOptions: [],
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
    const { name, selectedCriteriaOptions } = this.state
    const tag_list = selectedCriteriaOptions.join(', ')

    const audience = new Audience({ name, tag_list }, apiStore)
    await audience.API_create()

    this.reset()
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
      selectedCriteriaOptions: [],
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
    const {
      numCriteriaPerGroup,
      selectedCriteria,
      selectedCriteriaOptions,
    } = this.state

    remove(selectedCriteria, c => c === criteria)

    const { options, group } = getCriterionByName(criteria)
    remove(selectedCriteriaOptions, o => includes(options, o))
    numCriteriaPerGroup[group] -= 1
    this.setState({
      selectedCriteria,
      selectedCriteriaOptions,
      numCriteriaPerGroup,
    })
  }

  toggleCriteriaOption = (e, criteria) => {
    const { selectedCriteriaOptions, numCriteriaPerGroup } = this.state

    const { group } = getCriterionByName(criteria)

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

    this.setState({ selectedCriteriaOptions, numCriteriaPerGroup })
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

  prefixCriteriaOption(criteria, option) {
    return `${criteria} ${option}`
  }

  unPrefixCriteriaOption(criteria, prefixedOption) {
    return prefixedOption.replace(`${criteria} `, '')
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
    const { selectedCriteriaOptions } = this.state

    return this.state.selectedCriteria.map(criteria => {
      const { options, group } = getCriterionByName(criteria)
      const prefixedOptions = options.map(o =>
        this.prefixCriteriaOption(criteria, o)
      )
      const selectedOptions = filter(selectedCriteriaOptions, o =>
        includes(prefixedOptions, o)
      )
      const isLimited = criteriaLimitByGroup[group]
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
                <SmallHelperText>
                  Audiences are limited to a total of two interests or
                  publications.
                </SmallHelperText>
              </Box>
            )}
          </span>
          <SelectedOptionsWrapper wrap>
            {selectedOptions.map(option => (
              <SelectedOption key={`selected_${option}`}>
                {this.unPrefixCriteriaOption(criteria, option)}
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
    const { selectedCriteria, selectedCriteriaOptions, openMenus } = this.state

    return selectedCriteria.map(criteria => {
      const { options: availableOptions } = getCriterionByName(criteria)

      const options = availableOptions.map(option => {
        const prefixedOption = this.prefixCriteriaOption(criteria, option)

        return (
          <CheckboxSelectOption
            key={prefixedOption}
            classes={{ root: 'selectOption' }}
            value={prefixedOption}
          >
            <Checkbox
              checked={includes(selectedCriteriaOptions, prefixedOption)}
            />
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

  render() {
    return (
      <React.Fragment>
        <Modal
          title="Create New Audience"
          onClose={this.reset}
          open={this.props.open}
        >
          {this.reachedCriteriaLimit && <div>BIG WARNING</div>}
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
          </FieldContainer>
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
            <SmallHelperText>
              Default price per respondent for a custom audience is $4.70
            </SmallHelperText>
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
                  disabled={!this.state.valid || this.reachedCriteriaLimit}
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
}
AddAudienceModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AddAudienceModal
