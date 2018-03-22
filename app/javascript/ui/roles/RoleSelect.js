import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { MenuItem } from 'material-ui/Menu'
import Select from 'material-ui/Select'
import v from '~/utils/variables'
import {
  DisplayText,
  SubText
} from '~/ui/global/styled/typography'
import {
  Row,
  RowItemLeft,
} from '~/ui/global/styled/layout'
import UserAvatar from '~/ui/users/UserAvatar'

const StyledSelect = styled(Select)`
  .select {
    font-family: ${v.fonts.sans};
    font-size: 1rem;
    font-weight: ${v.weights.book};
  }

  .selectMenu: {
    background-color: transparent;
    &:focus { background-color: transparent; }
    &:hover { background-color: transparent; }
  }
`

class RoleSelect extends React.Component {
  onRoleSelect = (ev) => {
    ev.preventDefault()
    this.deleteRole().then(this.createRole(ev.target.value))
  }

  createRole(roleName) {
    const { onCreate, user } = this.props
    onCreate([user], roleName)
  }

  deleteRole = () => {
    const { role, user } = this.props
    return this.props.onDelete(role, user).then(() => {
      role.toUpdate = true
    })
  }

  render() {
    const { role, user } = this.props
    return (
      <Row>
        <span>
          <UserAvatar
            key={user.id}
            user={user}
            size={38}
          />
        </span>
        <RowItemLeft>
          <DisplayText>{user.name}</DisplayText><br />
          <SubText>{user.email}</SubText>
        </RowItemLeft>
        <span>
          <StyledSelect
            classes={{ root: 'select', selectMenu: 'selectMenu' }}
            displayEmpty
            disableUnderline
            name="role"
            onChange={this.onRoleSelect}
            value={role.name}
          >
            <MenuItem value="editor">Editor</MenuItem>
            <MenuItem value="viewer">Viewer</MenuItem>
          </StyledSelect>
        </span>
      </Row>
    )
  }
}

RoleSelect.propTypes = {
  role: MobxPropTypes.objectOrObservableObject.isRequired,
  user: MobxPropTypes.objectOrObservableObject.isRequired,
  onDelete: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
}

export default RoleSelect
