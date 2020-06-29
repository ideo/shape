import { PropTypes as MobxPropTypes } from 'mobx-react'

import ProfileIcon from '~/ui/icons/ProfileIcon'
import TemplateIcon from '~/ui/icons/TemplateIcon'
import SystemIcon from '~/ui/icons/SystemIcon'
import TestCollectionIcon from '~/ui/icons/TestCollectionIcon'
import FoamcoreBoardIcon from '~/ui/icons/collection_icons/FoamcoreBoardIcon'
import SubmissionBoxIcon from '~/ui/icons/SubmissionBoxIcon'
import FilledProfileIcon from '~/ui/icons/FilledProfileIcon'
import CollectionIcon from '~/ui/icons/CollectionIcon'

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
    icon = <SubmissionBoxIcon size="lg" />
  } else if (record.launchableTestId || record.isTestCollectionOrResults) {
    icon = <TestCollectionIcon />
  } else if (record.isBoard) {
    icon = <FoamcoreBoardIcon size="lg" />
  } else {
    icon = <CollectionIcon icon={record.icon} />
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
