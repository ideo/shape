import styled from 'styled-components'
import { map, range } from 'lodash'

import v from '~/utils/variables'

const AvatarGroup = styled.div`
  display: inline-block;
  margin: 0 8px;
  .placeholder,
  .admin,
  .editor,
  .viewer {
    display: inline-block;
    margin-left: 0px;
    margin-right: -12px;
    border: 1px solid ${v.colors.commonLight};
    /* for any transparent avatars */
    background-color: white;
    &:last-child {
      margin-right: 0;
    }
    ${props =>
      map(
        range(1, 6),
        i =>
          `:nth-child(${i}) {
            z-index: ${10 - i};
          }`
      )};
  }
  .placeholder {
    background-color: ${v.colors.commonMedium};
  }
`
AvatarGroup.displayName = 'AvatarGroup'

export default AvatarGroup
