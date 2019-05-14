import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { sortBy } from 'lodash'

import Avatar from '~/ui/global/Avatar'
import AvatarGroup from '~/ui/global/AvatarGroup'
import Tooltip from '~/ui/global/Tooltip'
import { AddButton } from '~/ui/global/styled/buttons'

const MAX_ADMINS_TO_SHOW = 4

const MORE_ADMINS = (
  <Avatar
    title="...and more admins"
    url=""
    className="placeholder"
    displayName
  />
)

@inject('apiStore')
@observer
class AdminUsersSummary extends React.Component {
  state = {
    adminUsers: [],
  }

  async componentDidMount() {
    const res = await this.fetchUsers()
    this.setState({ adminUsers: res.data })
  }

  fetchUsers() {
    const { apiStore } = this.props
    return apiStore.request('users/shape_admins')
  }

  renderUsers() {
    let users = sortBy(this.state.adminUsers, ['first_name'])
    users = users.slice(0, MAX_ADMINS_TO_SHOW)

    return users.map(user => {
      return (
        <Avatar
          className="admin"
          key={`${user.internalType}_${user.id}`}
          title={user.nameWithHints || user.name}
          url={user.pic_url_square || user.filestack_file_url}
          displayName
        />
      )
    })
  }

  render() {
    const adminCount = this.state.adminUsers.length

    return (
      <React.Fragment>
        <AvatarGroup>
          {this.renderUsers()}
          {adminCount > MAX_ADMINS_TO_SHOW && MORE_ADMINS}
        </AvatarGroup>
        <Tooltip title="Invite Shape Admin">
          <AddButton>+</AddButton>
        </Tooltip>
      </React.Fragment>
    )
  }
}

AdminUsersSummary.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AdminUsersSummary
