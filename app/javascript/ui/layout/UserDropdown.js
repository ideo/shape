import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { CONTEXT_COMBO, CONTEXT_USER } from '~/ui/global/MainMenuDropdown'
import Avatar from '~/ui/global/Avatar'
import AvatarDropdown from '~/ui/layout/AvatarDropdown'
import MainMenuDropdown from '~/ui/global/MainMenuDropdown'

@inject('apiStore', 'uiStore')
@observer
class UserDropdown extends React.Component {
  render() {
    const { apiStore, uiStore } = this.props
    const { currentUser } = apiStore
    const menuContext = uiStore.isMobile ? CONTEXT_COMBO : CONTEXT_USER

    return (
      <AvatarDropdown
        className="userDropdown"
        renderDropdown={({ isDropdownOpen, closeDropdown }) => (
          <MainMenuDropdown
            context={menuContext}
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
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default UserDropdown
