import _ from 'lodash'
import PropTypes from 'prop-types'
import styled from 'styled-components'

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
    /* for any transparent avatars */
    background-color: white;
    &:last-child {
      margin-right: 0;
    }
    ${props =>
      _.map(
        _.range(1, 6),
        i =>
          `:nth-child(${i}) {
            z-index: ${10 - i};
          }`
      )};

    box-shadow: 0 0 0 1px;
    /* box-shadow will use the color property by default */
    color: ${v.colors.commonLight};
    &.outlined {
      /* thicker outline */
      box-shadow: 0 0 0 4px;
      margin-right: -8px;
    }
    /* not the cleanest way to do this but it works; see note above about color */
    &.outline-Blue {
      color: ${v.colors.collaboratorPrimaryBlue};
    }
    &.outline-Yellow {
      color: ${v.colors.collaboratorPrimaryYellow};
    }
    &.outline-Purple {
      color: ${v.colors.collaboratorPrimaryPurple};
    }
    &.outline-Olive {
      color: ${v.colors.collaboratorPrimaryOlive};
    }
    &.outline-Salmon {
      color: ${v.colors.collaboratorPrimarySalmon};
    }
    &.outline-IcyBlue {
      color: ${v.colors.collaboratorPrimaryIcyBlue};
    }
    &.outline-Lavender {
      color: ${v.colors.collaboratorPrimaryLavender};
    }
    &.outline-Obsidian {
      color: ${v.colors.collaboratorPrimaryObsidian};
    }
    &.outline-Slate {
      color: ${v.colors.collaboratorPrimarySlate};
    }
    &.outline-Grey {
      color: ${v.colors.collaboratorPrimaryGrey};
    }
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
  children: PropTypes.node.isRequired,
  avatarCount: PropTypes.number.isRequired,
  placeholderTitle: PropTypes.string.isRequired,
}

export default AvatarGroup
