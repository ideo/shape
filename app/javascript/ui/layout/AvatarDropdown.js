import styled from 'styled-components'
import PropTypes from 'prop-types'

import ClickWrapper from '~/ui/layout/ClickWrapper'
import v from '~/utils/variables'

const StyledAvatarAndDropdown = styled.div`
  display: inline-block;
  margin-left: 8px;
  .user-avatar,
  .organization-avatar {
    cursor: pointer;
    margin-left: 0;
    margin-right: 0;
  }
  .user-menu,
  .org-menu {
    top: 15px;
    right: 20px;
    z-index: ${v.zIndex.aboveClickWrapper};
    .menu-toggle {
      display: none;
    }
  }
`
StyledAvatarAndDropdown.displayName = 'StyledAvatarAndDropdown'

class AvatarDropdown extends React.Component {
  state = {
    dropdownOpen: false,
  }

  openDropdown = () => {
    this.setState({ dropdownOpen: true })
  }
  closeDropdown = () => {
    this.setState({ dropdownOpen: false })
  }

  render() {
    const { openDropdown, closeDropdown } = this
    const { dropdownOpen: isDropdownOpen } = this.state
    const { className, renderAvatar, renderDropdown } = this.props
    const renderPropArgs = {
      isDropdownOpen,
      openDropdown,
      closeDropdown,
    }

    return (
      <StyledAvatarAndDropdown className={className}>
        {isDropdownOpen && renderDropdown(renderPropArgs)}
        {renderAvatar(renderPropArgs)}

        {isDropdownOpen && <ClickWrapper clickHandlers={[closeDropdown]} />}
      </StyledAvatarAndDropdown>
    )
  }
}

AvatarDropdown.propTypes = {
  className: PropTypes.string,
  renderAvatar: PropTypes.func.isRequired,
  renderDropdown: PropTypes.func.isRequired,
}

export default AvatarDropdown
