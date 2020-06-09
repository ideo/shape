import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import Button from '~/ui/global/Button'

import SubmissionBoxSettings from '~/ui/submission_box/SubmissionBoxSettings'
import AudienceSettingsWidget from '~/ui/test_collections/AudienceSettings/AudienceSettingsWidget'
import InlineLoader from '~/ui/layout/InlineLoader'
import Panel from '~/ui/global/Panel'
import { routingStore } from '~/stores'
import _ from 'lodash'

const SubmissionsSettings = ({ collection, closeModal }) => {
  const [submissionBoxes, setSubmissionBoxes] = useState([])
  const [submissionTemplateTest, setSubmissionTemplateTest] = useState(null)
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

        const {
          submission_template_test,
          submission_template_test_audiences,
        } = subBoxes[0]

        if (submission_template_test) {
          setSubmissionTemplateTest(submission_template_test)
        }

        if (submission_template_test_audiences.length > 0) {
          setAudiences(submission_template_test_audiences)

          const audienceSettingsMap = new Map()
          _.each(submission_template_test_audiences, audience => {
            audienceSettingsMap.set(audience.id, {
              selected: false,
              audience,
              displayCheckbox: true,
            })
          })

          setAudienceSettings(audienceSettingsMap)
        }
      }

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
      {audienceSettings.size > 0 && (
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
          challengeName={collection.challenge.name}
        />
      )}
      {submissionTemplateTest && (
        <Button
          onClick={() => {
            routingStore.routeTo('collections', submissionTemplateTest.id)
          }}
        >
          Go to Test Template
        </Button>
      )}
    </div>
  )
}

SubmissionsSettings.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  closeModal: PropTypes.func.isRequired,
}

export default SubmissionsSettings
