import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import ProfileIcon from '~/ui/icons/ProfileIcon'
import TemplateIcon from '~/ui/icons/TemplateIcon'
import SystemIcon from '~/ui/icons/SystemIcon'
import TestCollectionIcon from '~/ui/icons/TestCollectionIcon'
import FoamcoreBoardIcon from '~/ui/icons/FoamcoreBoardIcon'
import SubmissionBoxIconLg from '~/ui/icons/SubmissionBoxIconLg'

import CollectionIconHolder from '~/ui/global/CollectionIconHolder'

const CollectionTypeIcon = ({ record, css }) => {
  let icon = ''

  if (record.isUserProfile) {
    icon = <ProfileIcon />
  } else if (record.isProfileCollection) {
    icon = <SystemIcon />
  } else if (record.isTemplated && !record.isSubTemplate) {
    icon = <TemplateIcon circled />
  } else if (record.isSubmissionBox) {
    icon = <SubmissionBoxIconLg />
  } else if (record.launchableTestId) {
    icon = <TestCollectionIcon />
  } else if (record.isBoard) {
    icon = <FoamcoreBoardIcon large />
  }
  if (icon) {
    return (
      <CollectionIconHolder css={css} align="right">
        {icon}
      </CollectionIconHolder>
    )
  }
  return null
}

CollectionTypeIcon.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  css: PropTypes.string,
}

export default CollectionTypeIcon
