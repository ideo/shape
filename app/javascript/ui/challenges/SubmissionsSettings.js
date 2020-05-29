import { useState, useEffect } from 'react'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import SubmissionBoxSettings from '~/ui/submission_box/SubmissionBoxSettings'
import InlineLoader from '~/ui/layout/InlineLoader'

const SubmissionsSettings = ({ collection }) => {
  const [submissionBoxes, setSubmissionBoxes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const fetchSubmissions = async () => {
      const request = await collection.API_fetchChallengeSubmissionBoxCollections()
      setSubmissionBoxes(request.data)
      setIsLoading(false)
    }
    fetchSubmissions()
  })

  return (
    <div>
      {isLoading && <InlineLoader />}
      {submissionBoxes.map(submissionBox => (
        <SubmissionBoxSettings
          collection={submissionBox}
          key={submissionBox.id}
        />
      ))}
    </div>
  )
}

SubmissionsSettings.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default SubmissionsSettings
