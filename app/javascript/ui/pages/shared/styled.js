import { Flex } from 'reflexbox'
import styled from 'styled-components'

export const StyledTitleAndRoles = styled(Flex)`
  .page-menu {
    position: relative;
    top: -4px;
  }
  /* needs to be bumped down because there's no RolesSummary on items for now */
  .item-page .page-menu {
    top: 35px;
  }
  &.user-profile .title {
    cursor: pointer;
  }
`

export default {
  StyledTitleAndRoles
}
