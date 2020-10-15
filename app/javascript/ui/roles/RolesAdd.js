import _ from 'lodash'
import PropTypes from 'prop-types'
import { observable, action, runInAction } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import { Grid, Hidden, MenuItem } from '@material-ui/core'

import trackError from '~/utils/trackError'
import isEmail from '~/utils/isEmail'
import Button from '~/ui/global/Button'
import {
  Checkbox,
  FormActionsContainer,
  Select,
} from '~/ui/global/styled/forms'
import EntityAvatarAndName from '~/ui/global/EntityAvatarAndName'
import { Row, RowItemRight } from '~/ui/global/styled/layout'
import { DisplayText, Heading3 } from '~/ui/global/styled/typography'
import AutoComplete from '~/ui/global/AutoComplete'
import PillList from '~/ui/global/PillList'
import EmailCSVUploader from '~/ui/global/EmailCSVUploader'
import InlineLoader from '~/ui/layout/InlineLoader'
import { apiStore, uiStore, routingStore } from '~/stores'
import v, { FREEMIUM_USER_LIMIT } from '~/utils/variables'

const RightAligner = styled(Grid)`
  padding-right: 78px;
  min-width: 175px; /* 97px + padding */
`
RightAligner.displayName = 'StyledRightAligner'

const AdminGrid = styled.div`
  margin-bottom: 30px;
`

const GridTextSmall = styled.p`
  /* override default dialog font size and margin*/
  font-size: 0.75rem !important;
  margin-bottom: 10px !important;
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
  selectedGroupId = ''
  @observable
  sendInvites = true
  @observable
  syncedRoleTypes = []
  @observable
  loading = false

  constructor(props) {
    super(props)
    const [first] = this.props.roleTypes
    this.selectedRole = first
    uiStore.autocompleteMenuClosed()
    runInAction(() => {
      this.syncedRoleTypes = props.roleTypes
      this.selectedGroupId = _.get(props, 'record.default_group_id', '')
      if (this.selectedGroupId) {
        this.syncedRoleTypes = ['admin', 'member']
        this.selectedRole = 'member'
      }
    })

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
    if (ownerType === 'shapeAdmins') {
      searchMethod = 'searchUsers'
    }
    apiStore[searchMethod]({ query: term })
      .then(res => {
        if (!res.data) return
        uiStore.update('autocompleteValues', res.data.length)
        // NOTE: this is just to reject archived users who are marked on their `status`
        // whereas archived groups don't get indexed at all
        const validRecords = _.reject(res.data, {
          status: 'archived',
        })
        callback(this.mapItems(validRecords))
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
      // add a delay so that the selected users can render
      setTimeout(() => {
        uiStore.scrollToBottomOfModal()
      }, 100)
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
      if (ownerType === 'groups' || this.selectedGroupId) {
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

  get shouldAskForPaymentMethod() {
    const {
      active_users_count,
      has_payment_method,
      in_app_billing,
    } = apiStore.currentUserOrganization
    if (!in_app_billing || has_payment_method) return false
    const adding = this.emailUsers.length
    // if you're adding enough to go over the limit, show the warning
    return adding + active_users_count > FREEMIUM_USER_LIMIT
  }

  get emailUsers() {
    return this.selectedUsers
      .filter(selected => !selected.id)
      .map(selected => selected.email)
  }

  handleSave = async () => {
    const { record } = this.props
    const {
      sendInvites,
      selectedUsers,
      selectedRole,
      setLoading,
      resetSelectedUsers,
      emailUsers,
    } = this
    const { currentUserId, currentUserOrganization } = apiStore
    const { FREEMIUM_USER_LIMIT } = window
    const { name = 'this organization' } = currentUserOrganization
    if (this.shouldAskForPaymentMethod) {
      const popupAgreed = new Promise((resolve, reject) => {
        const { id } = currentUserOrganization
        const freeLimitPrompt = `Inviting these people will take ${name} over the free limit of ${FREEMIUM_USER_LIMIT}.`
        const confirmText = 'Add Payment Method'
        apiStore.fetchOrganizationAdmins(id).then(response => {
          const { data: admins } = response
          const AdminGridWrapper = ({ children }) => ({ children })

          const adminGrid = (
            <AdminGridWrapper admins={admins}>
              <AdminGrid>
                <Grid container>
                  <Grid item xs={12} key={'adminGridTitle'}>
                    <GridTextSmall>The administrators are:</GridTextSmall>
                  </Grid>
                  {admins.map(a => (
                    <Grid container key={a.id}>
                      <Grid item xs={6} key={`${a.id}-name`}>
                        <GridTextSmall>
                          {a.first_name} {a.last_name}
                        </GridTextSmall>
                      </Grid>
                      <Grid item xs={6} key={`${a.id}-email`}>
                        <GridTextSmall>{a.email}</GridTextSmall>
                      </Grid>
                    </Grid>
                  ))}
                </Grid>
              </AdminGrid>
            </AdminGridWrapper>
          )

          const adminModalProps = {
            prompt: `${freeLimitPrompt} Please add a payment method to continue.`,
            iconName: 'InviteUsers',
            confirmText,
            onCancel: () => {
              resolve(false)
            },
            onConfirm: () => resolve(true),
            backgroundColor: `${v.colors.primaryLight}`,
          }

          const modalProps = {
            prompt: `${freeLimitPrompt} Please ask an administrator of ${name} to add payment method.`,
            subPromptNode: adminGrid,
            iconName: 'InviteUsers',
            backgroundColor: `${v.colors.primaryLight}`,
            confirmText: 'Close',
            onConfirm: () => {
              resolve(false)
            },
            singleConfirmButton: true,
          }

          const adminIds = admins.map(a => a.id)
          const isAdmin = adminIds.indexOf(currentUserId) > -1

          if (isAdmin) {
            uiStore.confirm(adminModalProps)
          } else {
            uiStore.confirm(modalProps)
          }
        })
      })
      const agreed = await popupAgreed
      if (!agreed) {
        setLoading(false)
        resetSelectedUsers()
        return
      }
      routingStore.routeTo('/billing?openPaymentMethod=true') // routes to billing and opens card modal
      return
    }
    const fullUsers = selectedUsers.filter(selected => !!selected.id)

    if (this.selectedGroupId) {
      // If any of the selected entities are groups, this is an error condition
      // to add a group to a group
      if (fullUsers.find(entity => entity.internalType === 'groups')) {
        return uiStore.alert('You cannot add a group to another group')
      }
    }

    let created = { data: [] }
    let roles = []
    setLoading(true)
    if (emailUsers.length) {
      created = await this.props.onCreateUsers(emailUsers)
    }
    if (created && created.data) {
      roles = await this.props.onCreateRoles(
        [...created.data, ...fullUsers],
        selectedRole,
        { sendInvites, addToGroupId: this.selectedGroupId },
        record
      )
      // toggle addedNewRole to rerender RolesMenu roles
      runInAction(() => {
        uiStore.addedNewRole = true
      })
    }
    setLoading(false)
    resetSelectedUsers()
    runInAction(() => {
      uiStore.addedNewRole = false
    })
    return roles
  }

  @action
  handleRoleSelect = ev => {
    this.selectedRole = ev.target.value
  }

  @action
  handleGroupSelect = ev => {
    this.selectedGroupId = ev.target.value
    if (this.selectedGroupId) {
      this.syncedRoleTypes = ['admin', 'member']
      this.selectedRole = 'member'
    } else {
      this.syncedRoleTypes = this.props.roleTypes
      this.selectedRole = 'editor'
    }
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
    const { record } = this.props
    // either return the override label (if present) or just the passed in name
    // e.g. for labeling "Viewer" as "Participant"

    const roleLabels =
      record && record.isSubmissionBox ? { viewer: 'participant' } : {}
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
    const { addableGroups, title } = this.props
    const filteredAddableGroups = addableGroups.filter(
      group => !group.is_primary
    )
    return (
      <div>
        <Row align="center" style={{ marginBottom: 0, height: '32px' }}>
          <Heading3 noSpacing>{title}</Heading3>
          {!!addableGroups.length && (
            <RowItemRight>
              <Select
                classes={{ root: 'select', selectMenu: 'selectMenu' }}
                displayEmpty
                disableUnderline
                name="group"
                onChange={this.handleGroupSelect}
                value={this.selectedGroupId || ''}
                data-cy="permissionsGroupSelect"
              >
                <MenuItem key="no-group" value={''}>
                  <DisplayText color={v.colors.commonMedium}>
                    No group
                  </DisplayText>
                </MenuItem>
                {filteredAddableGroups.map(group => (
                  <MenuItem key={group.handle} value={group.id}>
                    <EntityAvatarAndName entity={group} />
                  </MenuItem>
                ))}
              </Select>
            </RowItemRight>
          )}
          <RowItemRight>
            <Select
              classes={{ root: 'select', selectMenu: 'selectMenu' }}
              displayEmpty
              disableUnderline
              name="role"
              onChange={this.handleRoleSelect}
              value={this.selectedRole}
              data-cy="permissionsRoleSelect"
            >
              {this.syncedRoleTypes.map(roleType => (
                <MenuItem key={roleType} value={roleType}>
                  <span data-cy="permissonsRoleLabel">
                    {this.labelFor(roleType)}
                  </span>
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
          <Button
            data-cy="Button"
            onClick={this.confirmSave}
            disabled={this.selectedUsers.length === 0}
          >
            Add
          </Button>
        </FormActionsContainer>
      </div>
    )
  }
}

RolesAdd.propTypes = {
  record: MobxPropTypes.objectOrObservableObject,
  roleTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onCreateRoles: PropTypes.func.isRequired,
  onCreateUsers: PropTypes.func.isRequired,
  ownerType: PropTypes.string.isRequired,
  addableGroups: MobxPropTypes.arrayOrObservableArray,
  title: PropTypes.string,
}
RolesAdd.defaultProps = {
  record: null,
  addableGroups: [],
  title: 'Add groups or people:',
}

export default RolesAdd
