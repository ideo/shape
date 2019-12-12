import { PropTypes as MobxPropTypes } from 'mobx-react'

import ProfileIcon from '~/ui/icons/ProfileIcon'
import TemplateIcon from '~/ui/icons/TemplateIcon'
import SystemIcon from '~/ui/icons/SystemIcon'
import TestCollectionIcon from '~/ui/icons/TestCollectionIcon'
import FoamcoreBoardIcon from '~/ui/icons/FoamcoreBoardIcon'
import SubmissionBoxIconLg from '~/ui/icons/SubmissionBoxIconLg'
import FilledProfileIcon from '~/ui/icons/FilledProfileIcon'
import CollectionIcon from '../icons/CollectionIcon'

export const editableCollectionTypes = {
  collection: <CollectionIcon />,
  project: <TemplateIcon />,
  method: <ProfileIcon />,
  prototype: <TestCollectionIcon />,
}

const CollectionTypeIcon = ({ record }) => {
  let icon = ''

  if (record.isUserProfile) {
    icon = <ProfileIcon />
  } else if (record.isProfileTemplate) {
    // Why is this showing up left and right of page header?
    // left icon page header
    icon = <FilledProfileIcon />
  } else if (record.isProfileCollection) {
    icon = <SystemIcon />
  } else if (record.isTemplated && !record.isSubTemplate) {
    // how to get this to work with just collection.isTemplated?
    icon = <TemplateIcon circled />
  } else if (record.isMasterTemplate) {
    // left icon page header and collection cover title
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
