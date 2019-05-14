import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { sortBy } from 'lodash'

import Avatar from '~/ui/global/Avatar'
import AvatarGroup from '~/ui/global/AvatarGroup'
import Tooltip from '~/ui/global/Tooltip'
import trackError from '~/utils/trackError'
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

  componentDidMount() {
    this.fetchUsers()
  }

  fetchUsers() {
    const { apiStore } = this.props
    apiStore
      .fetchShapeAdminUsers()
      .then(res => {
        this.setState({ adminUsers: res.data })
      })
      .catch(e => {
        trackError(e)
      })
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
