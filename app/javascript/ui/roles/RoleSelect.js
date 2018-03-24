import _ from 'lodash'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { MenuItem } from 'material-ui/Menu'
import {
  DisplayText,
  SubText
} from '~/ui/global/styled/typography'
import {
  Row,
  RowItemLeft,
} from '~/ui/global/styled/layout'
import { Select } from '~/ui/global/styled/forms'
import Avatar from '~/ui/global/Avatar'

class RoleSelect extends React.Component {
  onRoleSelect = (ev) => {
    ev.preventDefault()
    return this.deleteRole().then(() => this.createRole(ev.target.value))
  }

  createRole(roleName) {
    const { onCreate, entity } = this.props
    onCreate([entity], roleName)
  }

  deleteRole = () => {
    const { role, entity } = this.props
    return this.props.onDelete(role, entity).then(() => {
      role.toUpdate = true
    })
  }

  render() {
    const { role, roleTypes, entity } = this.props
    // TODO remove duplication with RolesAdd role select menu
    const url = entity.pic_url_square || entity.filestack_file_url
    return (
      <Row>
        <span>
          <Avatar
            key={entity.id}
            url={url}
            size={38}
          />
        </span>
        <RowItemLeft>
          <DisplayText>{entity.name}</DisplayText><br />
          <SubText>{entity.email}</SubText>
        </RowItemLeft>
        <span>
          <Select
            classes={{ root: 'select', selectMenu: 'selectMenu' }}
            displayEmpty
            disableUnderline
            name="role"
            onChange={this.onRoleSelect}
            value={role.name}
          >
            { roleTypes.map(roleType =>
              (<MenuItem key={roleType} value={roleType}>
                {_.startCase(roleType)}
              </MenuItem>))
            }
          </Select>
        </span>
      </Row>
    )
  }
}

RoleSelect.propTypes = {
  role: MobxPropTypes.objectOrObservableObject.isRequired,
  roleTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  entity: MobxPropTypes.objectOrObservableObject.isRequired,
  onDelete: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
}

export default RoleSelect
