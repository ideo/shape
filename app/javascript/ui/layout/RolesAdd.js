import PropTypes from 'prop-types'
import { observable, action } from 'mobx'
import { observer } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'
import AutoComplete from '~/ui/global/AutoComplete'
import PillList from '~/ui/global/PillList'

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

@observer
class RolesAdd extends React.Component {
  @action
  onUserSelected = (data) => {
    let user = data
    if (!data.id) {
      user = Object.assign({}, { name: data.custom, email: data.custom })
    }
    if (!this.selectedUsers.find((selected) => selected.name === user.name)) {
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
        this.props.onCreateRoles([...users, ...this.selectedUsers]))
      .then((roles) => {
        this.reset()
        return roles
      })
  }

  @action
  reset() {
    this.selectedUsers = []
  }

  @observable selectedUsers = []

  render() {
    return (
      <div>
        { this.selectedUsers.length > 0 && (
          <PillList
            itemList={this.selectedUsers}
            onItemDelete={this.onUserDelete}
          />)
        }
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
}
RolesAdd.defaultProps = {
  onSearch: () => {}
}

export default RolesAdd
