import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import ModalWithNavigation from '~/ui/global/modals/ModalWithNavigation'
import SubmissionsSettings from '~/ui/challenges/SubmissionsSettings'
import PhaseSettings from '~/ui/challenges/PhaseSettings'

const modalContents = ({ collection, submissionBoxes, onClose }) => {
  return [
    {
      name: 'Submission settings',
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
      component: (
        <PhaseSettings
          collection={collection}
          submissionBoxes={submissionBoxes}
          closeModal={onClose}
        />
      ),
    },
    { name: 'People', component: <div></div> },
    { name: 'Topics', component: <div></div> },
    { name: 'Styles', component: <div></div> },
  ]
}

const ChallengeSettingsModal = ({ collection, open, onClose }) => {
  const [challenge, setChallenge] = useState(null)
  const [submissionBoxes, setSubmissionBoxes] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Load the challenge
  useEffect(() => {
    if (!collection.challenge_id || !open) return
    const fetchChallenge = async () => {
      const result = await collection.challengeForCollection()
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
