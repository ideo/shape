import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import ModalWithNavigation from '~/ui/global/modals/ModalWithNavigation'
import PeopleSettings from '~/ui/challenges/PeopleSettings'
import SubmissionsSettings from '~/ui/challenges/SubmissionsSettings'
import PhaseSettings from '~/ui/challenges/PhaseSettings'
import ChallengeTopics from '~/ui/challenges/ChallengeTopics'

const modalContents = ({ collection, submissionBoxes, onClose }) => {
  return [
    {
      name: 'Submission settings',
      dataCy: 'ChallengeSettings-SubmissionsSettingsNav',
      component: (
        <SubmissionsSettings
          collection={collection}
          submissionBoxes={submissionBoxes}
          closeModal={onClose}
        />
      ),
    },
    {
      name: 'Phases',
      dataCy: 'ChallengeSettings-PhasesNav',
      component: (
        <PhaseSettings
          collection={collection}
          submissionBoxes={submissionBoxes}
          closeModal={onClose}
        />
      ),
    },
    {
      name: 'People',
      dataCy: 'ChallengeSettings-PeopleNav',
      component: (
        <PeopleSettings collection={collection} closeModal={onClose} />
      ),
    },
    {
      name: 'Topics',
      dataCy: 'ChallengeSettings-TopicsNav',
      component: (
        <ChallengeTopics collection={collection} closeModal={onClose} />
      ),
    },
  ]
}

const ChallengeSettingsModal = ({ collection, open, onClose }) => {
  const [challenge, setChallenge] = useState(null)
  const [submissionBoxes, setSubmissionBoxes] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Load the challenge
  useEffect(() => {
    if (!collection.parentChallenge || !open) return
    const fetchChallenge = async () => {
      const result = await collection.fetchChallengeForCollection()
      setChallenge(result)
    }
    fetchChallenge()
  }, [collection, open])

  // Load all submission boxes
  useEffect(() => {
    if (!challenge || !open) return
    const loadSubmissionBoxes = async () => {
      const request = await challenge.API_fetchSubmissionBoxSubCollections()
      setSubmissionBoxes(request.data)
      setIsLoading(false)
    }
    loadSubmissionBoxes()
  }, [challenge, open])

  if (!challenge) return ''

  const contents = modalContents({
    collection: challenge,
    submissionBoxes,
    onClose,
  })

  return (
    <ModalWithNavigation
      title="Challenge settings"
      contents={contents}
      open={open}
      showLoader={isLoading}
      onClose={onClose}
    />
  )
}

ChallengeSettingsModal.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool,
}

ChallengeSettingsModal.defaultProps = {
  open: false,
}

export default ChallengeSettingsModal
