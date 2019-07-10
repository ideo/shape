import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Avatar from '~/ui/global/Avatar'
import AvatarDropdown from '~/ui/layout/AvatarDropdown'
import MainMenuDropdown, { CONTEXT_ORG } from '~/ui/global/MainMenuDropdown'

@inject('apiStore', 'uiStore')
@observer
class OrganizationDropdown extends React.Component {
  get currentOrg() {
    const { apiStore, uiStore } = this.props
    const record = uiStore.viewingRecord
    let currentOrg = apiStore.currentUserOrganization
    // special case: anyone_can_view will show the org of that collection
    if (record && record.anyone_can_view && record.organization) {
      currentOrg = record.organization
    }
    return currentOrg
  }

  get avatar() {
    const { currentOrg } = this
    return {
      title: currentOrg.name,
      url: currentOrg.filestack_file_url,
    }
  }

  render() {
    const { avatar } = this
    const { apiStore } = this.props
    return (
      <AvatarDropdown
        className="orgDropdown"
        renderDropdown={({ isDropdownOpen, closeDropdown }) => (
          <MainMenuDropdown
            context={CONTEXT_ORG}
            open={isDropdownOpen}
            onItemClick={closeDropdown}
            showCurrentOrg={
              this.currentOrg.id !== apiStore.currentUserOrganization.id
            }
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
              title={avatar.title}
              url={avatar.url}
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
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrganizationDropdown
