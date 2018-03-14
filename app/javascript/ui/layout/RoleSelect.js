import PropTypes from 'prop-types'
import styled from 'styled-components'
import { toJS } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { withStyles } from 'material-ui/styles'
import { MenuItem } from 'material-ui/Menu';
import Select from 'material-ui/Select';
import v from '~/utils/variables'

const materialStyles = {
  root: {
    fontFamily: 'Gotham',
    fontSize: '16px',
  },
  selectMenu: {
    backgroundColor: 'transparent'
  }
}

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  width: 90%;
`
Row.displayName = 'Row'

const StyledText = styled.span`
  font-family: Gotham;
  font-size: 16px
`
StyledText.displayName = 'StyledText'

const StyledSmText = styled.span`
  vertical-align: super;
  font-family: Sentinel;
  font-size: 12px;
  color: ${v.colors.gray};
`
StyledSmText.displayName = 'StyledSmText'

class RoleSelect extends React.Component {
  onRoleSelect = (ev) => {
    ev.preventDefault()
    this.deleteRole().then(this.createRole(ev.target.value))
  }

  createRole(roleName) {
    const { onCreate, role } = this.props
    const roleData = Object.assign({}, {
      name: roleName,
      users: role.users.map((user) => { return { id: user.id }})
    })
    onCreate(roleData)
  }

  deleteRole = () => {
    const { role, user } = this.props
    return this.props.onDelete(role, user)
  }

  render() {
    const { classes, role, user } = this.props
    return (
      <Row>
        <span>
          <StyledText>{user.name}</StyledText><br />
          <StyledSmText>{user.email}</StyledSmText>
        </span>
        <span>
          <Select
            classes={classes}
            displayEmpty
            disableUnderline
            name="role"
            onChange={this.onRoleSelect}
            value={role.name}
          >
            <MenuItem value="editor">Editor</MenuItem>
            <MenuItem value="viewer">Viewer</MenuItem>
          </Select>
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
  classes: PropTypes.shape({
    paper: PropTypes.string,
  }).isRequired,
}

export default withStyles(materialStyles)(RoleSelect)
