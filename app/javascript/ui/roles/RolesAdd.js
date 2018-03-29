import _ from 'lodash'
import PropTypes from 'prop-types'
import { observable, action } from 'mobx'
import { observer } from 'mobx-react'
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
import { MenuItem } from 'material-ui/Menu'

@observer
class RolesAdd extends React.Component {
  @observable selectedUsers = []
  @observable selectedRole = ''

  constructor(props) {
    super(props)
    const [first] = this.props.roleTypes
    this.selectedRole = first
  }

  @action
  onUserSelected = (data) => {
    let user = data
    if (!data.id) {
      user = Object.assign({}, { name: data.custom, email: data.custom })
    }
    if (!this.selectedUsers.find((selected) => selected.email === user.email)) {
      this.selectedUsers.push(user)
    }
  }

  @action
  onUserDelete = (user) => {
    this.selectedUsers.remove(user)
  }

  onUserSearch = (searchTerm) =>
    this.props.onSearch(searchTerm).then((res) =>
      res.data.map((user) =>
        ({ value: user.email, label: user.name, data: user })))

  handleSave = (ev) => {
    const emails = this.selectedUsers
      .filter((selected) => !selected.id)
      .map((selected) => selected.email)

    const fullUsers = this.selectedUsers
      .filter((selected) => !!selected.id)

    let firstReq = Promise.resolve({ data: [] })
    if (emails.length) {
      firstReq = this.props.onCreateUsers(emails)
    }
    return firstReq.then((res) =>
      this.props.onCreateRoles(
        [...res.data, ...fullUsers], this.selectedRole
      ))
      .then((roles) => {
        this.reset()
        return roles
      })
  }

  @action
  handleRoleSelect = (ev) => {
    this.selectedRole = ev.target.value
  }

  @action
  reset() {
    this.selectedUsers = []
  }

  render() {
    const { roleTypes } = this.props
    return (
      <div>
        { this.selectedUsers.length > 0 && (
          <PillList
            itemList={this.selectedUsers}
            onItemDelete={this.onUserDelete}
          />)
        }
        <Row>
          <AutoComplete
            onInputChange={this.onUserSearch}
            onOptionSelect={this.onUserSelected}
          />
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
        </Row>
        <FormActionsContainer>
          <FormButton
            onClick={this.handleSave}
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
  onCreateRoles: PropTypes.func.isRequired,
  onCreateUsers: PropTypes.func.isRequired,
  onSearch: PropTypes.func,
}
RolesAdd.defaultProps = {
  onSearch: () => {}
}

export default RolesAdd
