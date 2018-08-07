import _ from 'lodash'
import PropTypes from 'prop-types'
import { observable, action } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import MenuItem from '@material-ui/core/MenuItem'

import trackError from '~/utils/trackError'
import isEmail from '~/utils/isEmail'
import {
  FormButton,
  FormActionsContainer,
  Select,
} from '~/ui/global/styled/forms'
import {
  Row,
  RowItemRight,
} from '~/ui/global/styled/layout'
import AutoComplete from '~/ui/global/AutoComplete'
import PillList from '~/ui/global/PillList'
import EmailCSVUploader from '~/ui/global/EmailCSVUploader'
import InlineLoader from '~/ui/layout/InlineLoader'
import { uiStore } from '~/stores'

const RightAligner = styled.span`
  margin-right: 30px;
  min-width: 97px;
`
RightAligner.displayName = 'StyledRightAligner'

@observer
class RolesAdd extends React.Component {
  @observable selectedUsers = []
  @observable selectedRole = ''
  @observable loading = false

  constructor(props) {
    super(props)
    const [first] = this.props.roleTypes
    this.selectedRole = first
  }

  @action
  onUserSelected = (data) => {
    let existing = null
    let entity = data
    // check if the input is just an email string e.g. "person@email.com"
    const emailInput = !data.id
    if (emailInput && !isEmail(data.custom)) {
      // try filtering out for emails within the string
      // NOTE: this will re-call onUserSelected with any valid emails
      this.handleEmailInput(_.filter(data.custom.match(/[^\s,]+/g), isEmail))
      return
    }
    if (data.internalType === 'users' || emailInput) {
      if (emailInput) {
        entity = { name: data.custom, email: data.custom, internalType: 'users' }
      }
      existing = this.selectedUsers
        .filter(selected => selected.internalType === 'users')
        .find(selected => selected.email === entity.email)
    } else if (data.internalType === 'groups') {
      existing = this.selectedUsers
        .filter(selected => selected.internalType === 'groups')
        .find(selected => selected.id === entity.id)
    } else {
      trackError(new Error(), { name: 'EntityNotUserOrGroup', message: 'Selected entity can only be user or group' })
    }
    if (!existing) {
      this.selectedUsers.push(entity)
    }
  }

  @action
  onUserDelete = (entity) => {
    this.selectedUsers.remove(entity)
  }

  @action
  setLoading = value => {
    this.loading = value
  }

  onUserSearch = (searchTerm) =>
    this.props.onSearch(searchTerm).then((res) =>
      res.data.map((user) =>
        ({ value: user.email, label: user.name, data: user })))

  confirmSave = () => {
    const { ownerType } = this.props
    if (this.selectedUsers.length > 10) {
      const confirmOpts = {
        prompt: '',
        cancelText: 'Cancel',
        confirmText: 'Continue',
        onConfirm: this.handleSave,
      }
      if (ownerType === 'groups') {
        confirmOpts.prompt = `
          Are you sure you want to add ${this.selectedUsers.length} users to this group?
        `
      } else {
        confirmOpts.prompt = `
          Are you sure you want to add ${this.selectedUsers.length}
          users to ${uiStore.viewingRecord.name}?
          Large numbers of users may be better managed by adding them to a group.
        `
        confirmOpts.cancelText = 'Go to People and Groups'
        confirmOpts.onCancel = () => {
          uiStore.closeRolesMenu()
          uiStore.update('organizationMenuPage', 'organizationPeople')
        }
      }
      uiStore.confirm(confirmOpts)
      return
    }
    this.handleSave()
  }

  handleSave = async () => {
    const emails = this.selectedUsers
      .filter((selected) => !selected.id)
      .map((selected) => selected.email)

    const fullUsers = this.selectedUsers
      .filter((selected) => !!selected.id)

    let created = { data: [] }
    this.setLoading(true)
    if (emails.length) {
      created = await this.props.onCreateUsers(emails)
    }
    const roles = await this.props.onCreateRoles(
      [...created.data, ...fullUsers], this.selectedRole
    )
    this.setLoading(false)
    this.reset()
    return roles
  }

  @action
  handleRoleSelect = (ev) => {
    this.selectedRole = ev.target.value
  }

  @action
  reset() {
    this.selectedUsers = []
  }

  handleEmailInput = (emails) => {
    _.each(emails, email => {
      this.onUserSelected({
        custom: email,
      })
    })
  }

  mapItems() {
    const { searchableItems } = this.props
    return searchableItems.map(item => {
      let value
      if (item.internalType === 'users') {
        value = item.email || item.name
      } else if (item.internalType === 'groups') {
        value = item.handle || item.name
      } else {
        console.warn('Can only search users and groups')
      }
      return { value, label: item.name, data: item }
    })
  }

  render() {
    const { roleTypes } = this.props
    return (
      <div style={{ marginBottom: '1rem' }}>
        {this.loading && <InlineLoader /> }
        { this.selectedUsers.length > 0 && (
          <PillList
            itemList={this.selectedUsers}
            onItemDelete={this.onUserDelete}
          />)
        }
        <Row>
          <AutoComplete
            options={this.mapItems()}
            onInputChange={this.onUserSearch}
            onOptionSelect={this.onUserSelected}
          />
          <RightAligner>
            <RowItemRight>
              <Select
                classes={{ root: 'select', selectMenu: 'selectMenu' }}
                displayEmpty
                disableUnderline
                name="role"
                onChange={this.handleRoleSelect}
                value={this.selectedRole}
              >
                { roleTypes.map(roleType =>
                  (<MenuItem key={roleType} value={roleType}>
                    {_.startCase(roleType)}
                  </MenuItem>))
                }
              </Select>
            </RowItemRight>
          </RightAligner>
        </Row>
        <Row style={{ marginBottom: '4rem' }}>
          <EmailCSVUploader
            onComplete={this.handleEmailInput}
          />
        </Row>
        <FormActionsContainer>
          <FormButton
            onClick={this.confirmSave}
            disabled={this.selectedUsers.length === 0}
          >
            Add
          </FormButton>
        </FormActionsContainer>
      </div>
    )
  }
}

RolesAdd.propTypes = {
  searchableItems: MobxPropTypes.arrayOrObservableArray.isRequired,
  roleTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onCreateRoles: PropTypes.func.isRequired,
  onCreateUsers: PropTypes.func.isRequired,
  onSearch: PropTypes.func,
  ownerType: PropTypes.string.isRequired,
}
RolesAdd.defaultProps = {
  onSearch: () => {}
}

export default RolesAdd
