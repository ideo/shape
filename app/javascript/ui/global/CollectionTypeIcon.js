import { PropTypes as MobxPropTypes } from 'mobx-react'

import ProfileIcon from '~/ui/icons/ProfileIcon'
import TemplateIcon from '~/ui/icons/TemplateIcon'
import SystemIcon from '~/ui/icons/SystemIcon'
import TestCollectionIcon from '~/ui/icons/TestCollectionIcon'
import FoamcoreBoardIcon from '~/ui/icons/FoamcoreBoardIcon'
import SubmissionBoxIconLg from '~/ui/icons/SubmissionBoxIconLg'
import FilledProfileIcon from '~/ui/icons/FilledProfileIcon'
import CollectionIconLg from '~/ui/icons/CollectionIconLg'
import ProfileIconLg from '~/ui/icons/ProfileIconLg'
import ProjectIcon from '~/ui/icons/ProjectIcon'
import PrototypeIcon from '~/ui/icons/PrototypeIcon'
import MethodIcon from '~/ui/icons/MethodIcon'

export const collectionTypeToIcon = {
  collection: <CollectionIconLg />,
  profile: <ProfileIconLg />,
  project: <ProjectIcon />,
  method: <MethodIcon />,
  prototype: <PrototypeIcon />,
}

const CollectionTypeIcon = ({ record }) => {
  let icon = ''

  if (record.isUserProfile) {
    icon = <ProfileIcon />
  } else if (record.isProfileTemplate) {
    icon = <FilledProfileIcon />
  } else if (record.isProfileCollection) {
    icon = <SystemIcon />
  } else if (record.isTemplated && !record.isSubTemplate) {
    icon = <TemplateIcon circled />
  } else if (record.isMasterTemplate) {
    icon = <TemplateIcon circled filled />
  } else if (record.isSubmissionBox) {
    icon = <SubmissionBoxIconLg />
  } else if (record.launchableTestId || record.isTestCollectionOrResults) {
    icon = <TestCollectionIcon />
  } else if (record.isBoard) {
    icon = <FoamcoreBoardIcon large />
  }
  if (icon) {
    return icon
  }
  return null
}

CollectionTypeIcon.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollectionTypeIcon
