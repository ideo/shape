import styled from 'styled-components'
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

export default StyledAvatarAndDropdown
