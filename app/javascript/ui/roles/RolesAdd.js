import _ from 'lodash'
import PropTypes from 'prop-types'
import { observable, action } from 'mobx'
import { observer } from 'mobx-react'
import styled from 'styled-components'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import { Grid, Hidden, MenuItem } from '@material-ui/core'

import trackError from '~/utils/trackError'
import isEmail from '~/utils/isEmail'
import {
  Checkbox,
  FormButton,
  FormActionsContainer,
  Select,
} from '~/ui/global/styled/forms'
import { Row, RowItemRight } from '~/ui/global/styled/layout'
import { Heading3 } from '~/ui/global/styled/typography'
import AutoComplete from '~/ui/global/AutoComplete'
import PillList from '~/ui/global/PillList'
import EmailCSVUploader from '~/ui/global/EmailCSVUploader'
import InlineLoader from '~/ui/layout/InlineLoader'
import { apiStore, uiStore } from '~/stores'

const RightAligner = styled(Grid)`
  padding-right: 78px;
  min-width: 175px; /* 97px + padding */
`
RightAligner.displayName = 'StyledRightAligner'

const StyledFormControlLabel = styled(FormControlLabel)`
  margin-top: -10px;
`

@observer
class RolesAdd extends React.Component {
  @observable
  selectedUsers = []
  @observable
  selectedRole = ''
  @observable
  sendInvites = true
  @observable
  loading = false

  constructor(props) {
    super(props)
    const [first] = this.props.roleTypes
    this.selectedRole = first
    uiStore.autocompleteMenuClosed()

    this.debouncedSearch = _.debounce(this._autocompleteSearch, 350)
  }

  _autocompleteSearch = (term, callback) => {
    if (!term) {
      uiStore.autocompleteMenuClosed()
      callback()
      return
    }

    const { ownerType } = this.props
    let searchMethod = 'searchUsersAndGroups'
    if (ownerType === 'groups') {
      searchMethod = 'searchUsers'
    }
    apiStore[searchMethod](term)
      .then(res => {
        uiStore.update('autocompleteValues', res.data.length)
        callback(this.mapItems(res.data))
      })
      .catch(e => {
        trackError(e)
      })
  }

  onSearch = (value, callback) => this.debouncedSearch(value, callback)

  @action
  onUserSelected = data => {
    let existing = null
    let entity = data

    // check if the input is just an email string e.g. "person@email.com"
    const emailInput = !data.id
    if (emailInput && !isEmail(data.custom)) {
      if (!data.custom) return
      // try filtering out for emails within the string
      // NOTE: this will re-call onUserSelected with any valid emails
      this.handleEmailInput(_.filter(data.custom.match(/[^\s,]+/g), isEmail))
      return
    }
    if (data.internalType === 'users' || emailInput) {
      if (emailInput) {
        entity = {
          name: data.custom,
          email: data.custom,
          internalType: 'users',
        }
      }
      existing = this.selectedUsers
        .filter(selected => selected.internalType === 'users')
        .find(selected => selected.email === entity.email)
    } else if (data.internalType === 'groups') {
      existing = this.selectedUsers
        .filter(selected => selected.internalType === 'groups')
        .find(selected => selected.id === entity.id)
    } else {
      trackError(new Error(), {
        name: 'EntityNotUserOrGroup',
        message: 'Selected entity can only be user or group',
      })
    }
    if (!existing) {
      this.selectedUsers.push(entity)
    }
  }

  @action
  onUserDelete = entity => {
    this.selectedUsers.remove(entity)
  }

  @action
  setLoading = value => {
    this.loading = value
  }

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
          Are you sure you want to add ${
            this.selectedUsers.length
          } users to this group?
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
    const { sendInvites } = this
    const emails = this.selectedUsers
      .filter(selected => !selected.id)
      .map(selected => selected.email)

    const fullUsers = this.selectedUsers.filter(selected => !!selected.id)

    let created = { data: [] }
    this.setLoading(true)
    if (emails.length) {
      created = await this.props.onCreateUsers(emails)
    }
    const roles = await this.props.onCreateRoles(
      [...created.data, ...fullUsers],
      this.selectedRole,
      { sendInvites }
    )
    this.setLoading(false)
    this.resetSelectedUsers()
    return roles
  }

  @action
  handleRoleSelect = ev => {
    this.selectedRole = ev.target.value
  }

  @action
  handleSendInvitesToggle = ev => {
    this.sendInvites = ev.target.checked
  }

  @action
  resetSelectedUsers = () => {
    this.selectedUsers = []
  }

  handleEmailInput = emails => {
    _.each(emails, email => {
      this.onUserSelected({
        custom: email,
      })
    })
  }

  mapItems = searchableItems =>
    searchableItems.map(item => {
      let value
      if (item.internalType === 'users') {
        value = item.email || item.name
      } else if (item.internalType === 'groups') {
        value = item.handle || item.name
      } else {
        // console.warn('Can only search users and groups')
      }
      return { value, label: item.name, data: item }
    })

  labelFor = roleType => {
    const { roleLabels } = this.props
    // either return the override label (if present) or just the passed in name
    // e.g. for labeling "Viewer" as "Participant"
    return _.startCase(roleLabels[roleType] || roleType)
  }

  renderPillList = () => {
    const count = this.selectedUsers.length
    if (count) {
      if (count > 100) {
        return (
          <PillList
            itemList={[
              {
                name: `${count} people pending invitation`,
              },
            ]}
            onItemDelete={this.resetSelectedUsers}
          />
        )
      }
      return (
        <PillList
          itemList={this.selectedUsers}
          onItemDelete={this.onUserDelete}
        />
      )
    }
    return ''
  }

  render() {
    const { title, roleTypes } = this.props
    return (
      <div>
        <Row style={{ marginBottom: 0 }}>
          <Heading3>{title}</Heading3>
          <RowItemRight>
            <Select
              classes={{ root: 'select', selectMenu: 'selectMenu' }}
              displayEmpty
              disableUnderline
              name="role"
              onChange={this.handleRoleSelect}
              value={this.selectedRole}
            >
              {roleTypes.map(roleType => (
                <MenuItem key={roleType} value={roleType}>
                  {this.labelFor(roleType)}
                </MenuItem>
              ))}
            </Select>
          </RowItemRight>
        </Row>
        {this.loading && <InlineLoader />}
        {this.renderPillList()}
        <Row style={{ marginBottom: '15px' }}>
          <AutoComplete
            options={[]}
            optionSearch={this.onSearch}
            onOptionSelect={this.onUserSelected}
            placeholder="email address or username"
            menuPlacement="top"
            creatable
          />
        </Row>
        <Row>
          <StyledFormControlLabel
            classes={{ label: 'form-control' }}
            control={
              <Checkbox
                checked={!!this.sendInvites}
                onChange={this.handleSendInvitesToggle}
                value="yes"
              />
            }
            label="Notify people"
          />
          <Hidden only="xs">
            <EmailCSVUploader onComplete={this.handleEmailInput} />
          </Hidden>
        </Row>
        <FormActionsContainer style={{ paddingBottom: '0' }}>
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
  roleTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  roleLabels: PropTypes.shape({
    editor: PropTypes.string,
    viewer: PropTypes.string,
  }),
  onCreateRoles: PropTypes.func.isRequired,
  onCreateUsers: PropTypes.func.isRequired,
  ownerType: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
}
RolesAdd.defaultProps = {
  roleLabels: {},
}

export default RolesAdd
