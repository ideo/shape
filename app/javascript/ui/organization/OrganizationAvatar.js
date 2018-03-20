import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Avatar from '~/ui/global/Avatar'

@inject('uiStore')
@observer
class OrganizationAvatar extends React.Component {
  handleClick = (ev) => {
    const { uiStore, organization } = this.props
    uiStore.openOrganizationMenu(organization)
  }

  render() {
    const { organization, size } = this.props
    return (
      <button onClick={this.handleClick}>
        <Avatar
          title={organization.name}
          size={size}
          className="orgAvatar"
          url={organization.pic_url_square}
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
