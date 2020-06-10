import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import Button from '~/ui/global/Button'

import SubmissionBoxSettings from '~/ui/submission_box/SubmissionBoxSettings'
import AudienceSettingsWidget from '~/ui/test_collections/AudienceSettings/AudienceSettingsWidget'
import InlineLoader from '~/ui/layout/InlineLoader'
import Panel from '~/ui/global/Panel'
import { routingStore, apiStore } from '~/stores'
import _ from 'lodash'

const SubmissionsSettings = ({ collection, closeModal }) => {
  const [submissionBoxes, setSubmissionBoxes] = useState([])
  const [submissionTemplateTest, setSubmissionTemplateTest] = useState(null)
  const [audiences, setAudiences] = useState([])
  const [audienceSettings, setAudienceSettings] = useState(new Map())
  const [viewingSubmissionBoxId, setViewingSubmissionBoxId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // NOTE: these are the based on onToggleCheckbox and toggleTestAudience under AudienceSettings, modified to use hooks
  const onToggleCheckbox = async e => {
    const id = e.target.value
    const setting = audienceSettings.get(id)
    setting.selected = !setting.selected

    // NOTE: see https://medium.com/swlh/using-es6-map-with-react-state-hooks-800b91eedd5f
    setAudienceSettings(new Map(audienceSettings.set(id, setting)))
    const { test_audience } = setting
    toggleTestAudience(test_audience)
  }

  const toggleTestAudience = async testAudience => {
    let open = testAudience.status === 'open'
    testAudience.status = open ? 'closed' : 'open'
    open = !open
    await testAudience.patch()
  }

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

        await apiStore.fetchOrganizationAudiences(
          apiStore.currentUserOrganizationId
        )

        const challengeAudiences = _.filter(apiStore.audiences, audience => {
          return (
            audience.isLinkSharing || audience.audience_type === 'challenge'
          )
        })

        if (!_.isEmpty(challengeAudiences)) {
          setAudiences(challengeAudiences)

          const audienceSettingsMap = new Map()
          _.each(challengeAudiences, audience => {
            const testAudience = submission_template_test_audiences.find(
              testAudience => testAudience.audience_id === audience.id
            )

            let selected = !!testAudience
            if (testAudience) {
              selected = testAudience.status === 'open'
            }

            audienceSettingsMap.set(audience.id, {
              selected,
              audience,
              test_audience: testAudience,
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
          onToggleCheckbox={onToggleCheckbox}
          onInputChange={() => {}}
          totalPrice={''}
          audiences={audiences}
          numPaidQuestions={0}
          audienceSettings={audienceSettings}
          afterAddAudience={() => {}}
          locked={false}
          displayChallengeAudiences={true}
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
