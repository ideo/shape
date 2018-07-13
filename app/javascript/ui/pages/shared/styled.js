import { Flex } from 'reflexbox'
import styled from 'styled-components'

import v from '~/utils/variables'

export const StyledTitleAndRoles = styled(Flex)`
  .title {
    max-width: 70%;
  }
  @media only screen and (max-width: ${v.responsive.largeBreakpoint}px) {
    .title {
      max-width: 65%;
    }
  }
  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    .title {
      max-width: 90%;
    }
  }
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
