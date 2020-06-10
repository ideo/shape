import _ from 'lodash'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { routingStore, apiStore, uiStore } from '~/stores'
import SubmissionBoxSettings from '~/ui/submission_box/SubmissionBoxSettings'
import AudienceSettingsWidget from '~/ui/test_collections/AudienceSettings/AudienceSettingsWidget'
import AudienceHeading from '~/ui/test_collections/AudienceSettings/AudienceHeading'
import EditFeedbackButton from '~/ui/challenges/EditFeedbackButton'
import InlineLoader from '~/ui/layout/InlineLoader'
import Panel from '~/ui/global/Panel'

const AudienceHeadingWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  /* align with submission format */
  width: 92%;
  padding-top: 10px;
`

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
    await test_audience.API_toggleAudienceStatus()
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
        <div>
          <AudienceHeadingWrapper>
            <AudienceHeading />
            <EditFeedbackButton
              onClick={() => {
                uiStore.update('challengeSettingsOpen', false)
                routingStore.routeTo('collections', submissionTemplateTest.id)
              }}
            />
          </AudienceHeadingWrapper>
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
        </div>
      )}
    </div>
  )
}

SubmissionsSettings.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  closeModal: PropTypes.func.isRequired,
}

export default SubmissionsSettings
