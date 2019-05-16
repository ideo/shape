import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Avatar from '~/ui/global/Avatar'
import AvatarDropdown from '~/ui/layout/AvatarDropdown'
import MainMenuDropdown, { CONTEXT_ORG } from '~/ui/global/MainMenuDropdown'

@inject('apiStore')
@observer
class OrganizationDropdown extends React.Component {
  render() {
    const { apiStore } = this.props
    const { currentUser } = apiStore
    const primaryGroup = currentUser.current_organization.primary_group

    return (
      <AvatarDropdown
        className="orgDropdown"
        renderDropdown={({ isDropdownOpen, closeDropdown }) => (
          <MainMenuDropdown
            context={CONTEXT_ORG}
            open={isDropdownOpen}
            onItemClick={closeDropdown}
          />
        )}
        renderAvatar={({ openDropdown }) => (
          <button
            style={{ display: 'block' }}
            className="orgBtn"
            data-cy="OrgMenuBtn"
            onClick={openDropdown}
          >
            <Avatar
              title={primaryGroup.name}
              url={primaryGroup.filestack_file_url}
              className="organization-avatar"
              responsive={false}
            />
          </button>
        )}
      />
    )
  }
}

OrganizationDropdown.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrganizationDropdown
