import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import { ChallengeWithoutSubmissionBoxMessage } from '~/ui/challenges/PhaseCollectionRow'
import SubmissionBoxSettings from '~/ui/submission_box/SubmissionBoxSettings'
import Panel from '~/ui/global/Panel'

const SubmissionsSettings = ({ collection, submissionBoxes, closeModal }) => {
  const viewingSubmissionBoxId =
    submissionBoxes.length === 1 ? submissionBoxes[0].id : null

  if (submissionBoxes.length === 0) {
    return <ChallengeWithoutSubmissionBoxMessage />
  }

  return (
    <div>
      {submissionBoxes.map(submissionBox => (
        <Panel
          key={submissionBox.id}
          title={submissionBox.name}
          open={viewingSubmissionBoxId === submissionBox.id}
          data-cy="SubmissionSettings-SubmissionPanel"
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
