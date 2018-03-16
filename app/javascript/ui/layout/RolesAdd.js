import PropTypes from 'prop-types'
import { observable, action } from 'mobx'
import { observer } from 'mobx-react'
import styled from 'styled-components'
import { withStyles } from 'material-ui/styles'
import v from '~/utils/variables'
import AutoComplete from '~/ui/global/AutoComplete'
import PillList from '~/ui/global/PillList'
import Select from 'material-ui/Select'
import { MenuItem } from 'material-ui/Menu'

const materialStyles = {
  selectMenu: {
    backgroundColor: 'transparent',
    '&:focus': { backgroundColor: 'transparent' },
    '&:hover': { backgroundColor: 'transparent' },
  }
}

const Button = styled.button`
  width: 183px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  height: 40px;
  font-weight: 500;
  font-size: 16px;
  font-family: Gotham;
  cursor: pointer;
  color: white;
  border-radius: 19.5px;
  border: none;
  background-color: ${v.colors.blackLava};
`

const StyledActionBox = styled.div`
  padding-bottom: 14px;
  text-align: center;
`

const RowRight = styled.div`
  float: right;
  margin-right: 64px;
`

@observer
class RolesAdd extends React.Component {
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
    this.props.onCreateUsers(emails)
      .then((users) =>
        this.props.onCreateRoles(
          [...users, ...this.selectedUsers], this.selectedRole
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

  @observable selectedUsers = []
  @observable selectedRole = 'viewer'

  render() {
    const { classes } = this.props
    return (
      <div>
        { this.selectedUsers.length > 0 && (
          <PillList
            itemList={this.selectedUsers}
            onItemDelete={this.onUserDelete}
          />)
        }
        <RowRight>
          <Select
            classes={classes}
            displayEmpty
            disableUnderline
            name="role"
            onChange={this.handleRoleSelect}
            value={this.selectedRole}
          >
            <MenuItem value="editor">Editor</MenuItem>
            <MenuItem value="viewer">Viewer</MenuItem>
          </Select>
        </RowRight>
        <AutoComplete
          onInputChange={this.onUserSearch}
          onOptionSelect={this.onUserSelected}
        />
        <StyledActionBox>
          <Button onClick={this.handleSave}>Add</Button>
        </StyledActionBox>
      </div>
    )
  }
}

RolesAdd.propTypes = {
  onCreateRoles: PropTypes.func.isRequired,
  onCreateUsers: PropTypes.func.isRequired,
  onSearch: PropTypes.func,
  classes: PropTypes.shape({
  selectMenu : PropTypes.string,
  }).isRequired,
}
RolesAdd.defaultProps = {
  onSearch: () => {}
}

export default withStyles(materialStyles)(RolesAdd)
