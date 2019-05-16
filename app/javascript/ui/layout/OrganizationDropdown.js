import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Avatar from '~/ui/global/Avatar'
import ClickWrapper from '~/ui/layout/ClickWrapper'
import MainMenuDropdown, { CONTEXT_ORG } from '~/ui/global/MainMenuDropdown'
import StyledAvatarAndDropdown from '~/ui/layout/StyledAvatarAndDropdown'

@inject('apiStore')
@observer
class OrganizationDropdown extends React.Component {
  state = {
    dropdownOpen: false,
  }

  createClickHandler = ({ open }) => () => this.setState({ dropdownOpen: open })

  render() {
    const { dropdownOpen } = this.state
    const {
      apiStore: { currentUser },
    } = this.props
    const primaryGroup = currentUser.current_organization.primary_group

    return (
      <StyledAvatarAndDropdown className="orgDropdown">
        {dropdownOpen && (
          <MainMenuDropdown
            context={CONTEXT_ORG}
            open={dropdownOpen}
            onItemClick={this.createClickHandler({ open: false })}
          />
        )}

        <button
          style={{ display: 'block' }}
          className="orgBtn"
          data-cy="OrgMenuBtn"
          onClick={this.createClickHandler({ open: true })}
        >
          <Avatar
            title={primaryGroup.name}
            url={primaryGroup.filestack_file_url}
            className="organization-avatar"
            responsive={false}
          />
        </button>

        {dropdownOpen && (
          <ClickWrapper
            clickHandlers={[this.createClickHandler({ open: false })]}
          />
        )}
      </StyledAvatarAndDropdown>
    )
  }
}

OrganizationDropdown.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrganizationDropdown
