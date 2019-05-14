import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Avatar from '~/ui/global/Avatar'
import trackError from '~/utils/trackError'

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
    return this.state.adminUsers.map(user => {
      return (
        <Avatar
          key={`${user.internalType}_${user.id}`}
          title={user.nameWithHints || user.name}
          url={user.pic_url_square || user.filestack_file_url}
          displayName
        />
      )
    })
  }

  render() {
    return this.renderUsers()
  }
}

AdminUsersSummary.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AdminUsersSummary
