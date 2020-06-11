import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import SubmissionBoxSettings from '~/ui/submission_box/SubmissionBoxSettings'
import Panel from '~/ui/global/Panel'

const SubmissionsSettings = ({ collection, submissionBoxes, closeModal }) => {
  const viewingSubmissionBoxId =
    submissionBoxes.length === 1 ? submissionBoxes[0].id : null
  return (
    <div>
      {submissionBoxes.map(submissionBox => (
        <Panel
          key={submissionBox.id}
          title={submissionBox.name}
          open={viewingSubmissionBoxId === submissionBox.id}
        >
          <SubmissionBoxSettings
            collection={submissionBox}
            closeModal={closeModal}
          />
        </Panel>
      ))}
    </div>
  )
}

SubmissionsSettings.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  submissionBoxes: MobxPropTypes.arrayOrObservableArray.isRequired,
  closeModal: PropTypes.func.isRequired,
}

export default SubmissionsSettings
