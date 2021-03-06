import { Flex } from 'reflexbox'
import styled from 'styled-components'

import v from '~/utils/variables'

export const StyledTitleAndRoles = styled(Flex)`
  flex-grow: 1;
  @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
    padding-top: 4px;
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
  .title {
    padding-top: 4px;

    @media only screen and (max-width: ${v.responsive.smallBreakpoint}px) {
      padding-top: 10px;
    }

    > * {
      margin-right: 20px;
      &:first-child,
      &.styled-name {
        margin-right: 10px;
      }
      &:last-child {
        margin-right: 0;
      }
    }
  }
`

export default {
  StyledTitleAndRoles,
}
