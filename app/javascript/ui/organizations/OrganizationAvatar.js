import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Avatar from '~/ui/global/Avatar'

@inject('uiStore')
@observer
class OrganizationAvatar extends React.Component {
  handleClick = (ev) => {
    const { uiStore } = this.props
    uiStore.update('organizationMenuOpen', true)
  }

  render() {
    const { organization, size } = this.props
    return (
      <button onClick={this.handleClick}>
        <Avatar
          title={organization.name}
          size={size}
          className="orgAvatar"
          url={organization.filestack_file_url}
        />
      </button>
    )
  }
}

OrganizationAvatar.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
  size: PropTypes.number,
}
OrganizationAvatar.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
OrganizationAvatar.defaultProps = {
  size: 34,
}

export default OrganizationAvatar
