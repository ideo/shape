import _ from 'lodash'
import PropTypes from 'prop-types'

import { AddButton } from '~/ui/global/styled/buttons'
import Avatar, { AvatarPropTypes } from '~/ui/global/Avatar'
import AvatarGroup from '~/ui/global/AvatarGroup'
import { StyledRolesSummary } from '~/ui/roles/RolesSummary'
import v from '~/utils/variables'

const AvatarList = ({ avatars, onAdd, reviewerStatuses }) => {
  return (
    <StyledRolesSummary>
      <div className="roles-summary--inner">
        <AvatarGroup
          placeholderTitle="...and more"
          avatarCount={avatars.length}
        >
          {avatars.map(avatar => {
            const statusForUser = _.find(reviewerStatuses, status => {
              return parseInt(status.user_id) === parseInt(avatar.id)
            })
            return (
              <Avatar
                key={`${avatar.internalType}_${avatar.id}`}
                title={avatar.nameWithHints || avatar.name}
                url={avatar.pic_url_square || avatar.filestack_file_url}
                color={
                  statusForUser
                    ? v.statusColor[statusForUser.status]
                    : 'transparent'
                }
                className="avatar viewer bordered outlined"
                // user_profile_collection_id will be null if its a group
                linkToCollectionId={avatar.user_profile_collection_id}
              />
            )
          })}
        </AvatarGroup>
        <AddButton onClick={onAdd}>+</AddButton>
      </div>
    </StyledRolesSummary>
  )
}

AvatarList.propTypes = {
  avatars: PropTypes.arrayOf(PropTypes.shape(AvatarPropTypes)).isRequired,
  onAdd: PropTypes.func.isRequired,
  reviewerStatuses: PropTypes.arrayOrObservableArray,
}

AvatarList.defaultProps = {
  reviewerStatuses: [],
}

export default AvatarList
