import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import SubmissionBoxSettings from '~/ui/submission_box/SubmissionBoxSettings'
import InlineLoader from '~/ui/layout/InlineLoader'
import Panel from '~/ui/global/Panel'

const SubmissionsSettings = ({ collection, closeModal }) => {
  const [submissionBoxes, setSubmissionBoxes] = useState([])
  const [viewingSubmissionBoxId, setViewingSubmissionBoxId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSubmissions = async () => {
      const request = await collection.API_fetchChallengeSubmissionBoxCollections()
      const subBoxes = request.data
      setSubmissionBoxes(subBoxes)
      if (subBoxes.length > 0) {
        setViewingSubmissionBoxId(subBoxes[0].id)
      }
      setIsLoading(false)
    }
    fetchSubmissions()
  }, [collection])

  return (
    <div>
      {isLoading && <InlineLoader />}
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
  closeModal: PropTypes.func.isRequired,
}

export default SubmissionsSettings
