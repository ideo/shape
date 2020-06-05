import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import SubmissionBoxSettings from '~/ui/submission_box/SubmissionBoxSettings'
import AudienceSettingsWidget from '~/ui/test_collections/AudienceSettings/AudienceSettingsWidget'
import InlineLoader from '~/ui/layout/InlineLoader'
import Panel from '~/ui/global/Panel'
import _ from 'lodash'

const SubmissionsSettings = ({ collection, closeModal }) => {
  const [submissionBoxes, setSubmissionBoxes] = useState([])
  const [audiences, setAudiences] = useState([])
  const [audienceSettings, setAudienceSettings] = useState(new Map())
  const [viewingSubmissionBoxId, setViewingSubmissionBoxId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initSubmissionSettings = async () => {
      const submissionsRequest = await collection.API_fetchChallengeSubmissionBoxCollections()
      const subBoxes = submissionsRequest.data
      setSubmissionBoxes(subBoxes)
      if (subBoxes.length > 0) {
        setViewingSubmissionBoxId(subBoxes[0].id)
      }

      const audiencesRequest = await collection.API_fetchChallengeAudiences()
      setAudiences(audiencesRequest.data)

      const audiencesForSettings = audiencesRequest.data
      const audienceSettingsMap = new Map()
      _.each(audiencesForSettings, audience => {
        // FIXME: audiences are not datx models so this won't render names
        // audience.name = `${collection.challenge_name} ${audience.name}`
        audienceSettingsMap.set(audience.id, {
          selected: false,
          audience,
          displayCheckbox: true,
          challenge: collection.challenge,
        })
      })

      setAudienceSettings(audienceSettingsMap)

      setIsLoading(false)
    }
    initSubmissionSettings()
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
      {
        <AudienceSettingsWidget
          onToggleCheckbox={() => {}}
          onInputChange={() => {}}
          totalPrice={''}
          audiences={audiences}
          numPaidQuestions={0}
          audienceSettings={audienceSettings}
          afterAddAudience={() => {}}
          locked={false}
          useChallengeAudienceSettings={true}
        />
      }
    </div>
  )
}

SubmissionsSettings.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  closeModal: PropTypes.func.isRequired,
}

export default SubmissionsSettings
