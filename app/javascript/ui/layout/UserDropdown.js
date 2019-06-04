import { computed } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import MainMenuDropdown, {
  CONTEXT_ADMIN,
  CONTEXT_COMBO,
  CONTEXT_USER,
} from '~/ui/global/MainMenuDropdown'
import Avatar from '~/ui/global/Avatar'
import AvatarDropdown from '~/ui/layout/AvatarDropdown'

@inject('apiStore', 'routingStore', 'uiStore')
@observer
class UserDropdown extends React.Component {
  @computed
  get menuContext() {
    const { routingStore, uiStore } = this.props
    // The organization menu is not needed in the admin area.
    if (routingStore.isAdmin)
      return uiStore.isMobile ? CONTEXT_ADMIN : CONTEXT_USER
    // Combine the organization and user menu on mobile.
    return uiStore.isMobile ? CONTEXT_COMBO : CONTEXT_USER
  }

  render() {
    const { apiStore } = this.props
    const { currentUser } = apiStore

    return (
      <AvatarDropdown
        className="userDropdown"
        renderDropdown={({ isDropdownOpen, closeDropdown }) => (
          <MainMenuDropdown
            context={this.menuContext}
            open={isDropdownOpen}
            onItemClick={closeDropdown}
          />
        )}
        renderAvatar={({ openDropdown }) => (
          <button
            style={{ display: 'block' }}
            className="userBtn"
            onClick={openDropdown}
          >
            <Avatar
              title={currentUser.name}
              url={currentUser.pic_url_square}
              className="user-avatar"
              responsive={false}
            />
          </button>
        )}
      />
    )
  }
}

UserDropdown.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default UserDropdown
