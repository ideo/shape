import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import EntityAvatarAndName from '~/ui/global/EntityAvatarAndName'
import PublicSharingOptions from '~/ui/global/PublicSharingOptions'
import { apiStore, uiStore } from '~/stores'

class PeopleSettings extends React.Component {
  get groups() {
    const { collection } = this.props
    const onClickHandler = groupId => async () => {
      await apiStore.request(`groups/${groupId}`)
      uiStore.openOptionalMenus({
        manage_group_id: groupId,
      })
    }
    return [
      {
        id: collection.challenge_admin_group_id,
        name: `${collection.name} Admins`,
        onClick: onClickHandler(collection.challenge_admin_group_id),
      },
      {
        id: collection.challenge_reviewer_group_id,
        name: `${collection.name} Reviewers`,
        onClick: onClickHandler(collection.challenge_reviewer_group_id),
      },
      {
        id: collection.challenge_participant_group_id,
        name: `${collection.name} Participants`,
        onClick: onClickHandler(collection.challenge_participant_group_id),
      },
    ]
  }

  render() {
    const { collection } = this.props
    return (
      <div>
        <PublicSharingOptions
          record={collection}
          canEdit={true}
          reloadGroups={() => {}}
          startMenuOpen
        />
        <hr />
        <div>
          {this.groups.map(group => (
            <div>
              <EntityAvatarAndName entity={group} />
            </div>
          ))}
        </div>
      </div>
    )
  }
}
PeopleSettings.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  closeModal: PropTypes.func.isRequired,
}

export default PeopleSettings
