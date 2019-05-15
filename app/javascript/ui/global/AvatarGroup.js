import PropTypes from 'prop-types'
import styled from 'styled-components'
import { map, range } from 'lodash'

import Avatar from '~/ui/global/Avatar'
import v from '~/utils/variables'

export const MAX_AVATARS_TO_SHOW = 4

const StyledAvatarGroup = styled.div`
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
StyledAvatarGroup.displayName = 'StyledAvatarGroup'

class AvatarGroup extends React.PureComponent {
  render() {
    const { avatarCount, children, placeholderTitle } = this.props

    return (
      <StyledAvatarGroup>
        {children}
        {avatarCount > MAX_AVATARS_TO_SHOW && (
          <Avatar
            title={placeholderTitle}
            url=""
            className="placeholder"
            displayName
          />
        )}
      </StyledAvatarGroup>
    )
  }
}

AvatarGroup.propTypes = {
  children: PropTypes.node,
  avatarCount: PropTypes.number.isRequired,
  placeholderTitle: PropTypes.string.isRequired,
}

export default AvatarGroup
