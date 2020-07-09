import PropTypes from 'prop-types'

import { AddButton } from '~/ui/global/styled/buttons'
import Avatar, { AvatarPropTypes } from '~/ui/global/Avatar'
import AvatarGroup from '~/ui/global/AvatarGroup'
import { StyledRolesSummary } from '~/ui/roles/RolesSummary'

const AvatarList = ({ avatars, onAdd }) => {
  return (
    <StyledRolesSummary>
      <div className="roles-summary--inner">
        <AvatarGroup
          placeholderTitle="...and more"
          avatarCount={avatars.length}
        >
          {avatars.map(avatar => (
            <Avatar
              key={`${avatar.pic_url_square}`}
              title={avatar.nameWithHints || avatar.name}
              url={avatar.pic_url_square || avatar.filestack_file_url}
              color={avatar.color}
              className="avatar viewer bordered outlined"
              // user_profile_collection_id will be null if its a group
              linkToCollectionId={avatar.user_profile_collection_id}
            />
          ))}
        </AvatarGroup>
        <AddButton onClick={onAdd}>+</AddButton>
      </div>
    </StyledRolesSummary>
  )
}

AvatarList.propTypes = {
  avatars: PropTypes.arrayOf(PropTypes.shape(AvatarPropTypes)).isRequired,
  onAdd: PropTypes.func.isRequired,
}

export default AvatarList
