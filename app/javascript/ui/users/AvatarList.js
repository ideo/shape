import PropTypes from 'prop-types'

import Avatar, { AvatarPropTypes } from '~/ui/global/Avatar'
import AvatarGroup from '~/ui/global/AvatarGroup'

const AvatarList = ({ avatars }) => {
  return (
    <AvatarGroup placeholderTitle="...and more viewers">
      {avatars.map(avatar => (
        <Avatar
          key={`${avatar.internalType}_${avatar.id}`}
          title={avatar.nameWithHints || avatar.name}
          url={avatar.pic_url_square || avatar.filestack_file_url}
          // user_profile_collection_id will be null if its a group
          linkToCollectionId={avatar.user_profile_collection_id}
        />
      ))}
    </AvatarGroup>
  )
}

AvatarList.propTypes = {
  avatars: PropTypes.arrayOf(PropTypes.shape(AvatarPropTypes)),
}

export default AvatarList
