import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import ModalWithNavigation from '~/ui/global/modals/ModalWithNavigation'
import SubmissionsSettings from '~/ui/challenges/SubmissionsSettings'
import PhaseSettings from '~/ui/challenges/PhaseSettings'

const modalContents = ({ collection, onClose } = {}) => {
  return [
    {
      name: 'Submission settings',
      component: (
        <SubmissionsSettings collection={collection} closeModal={onClose} />
      ),
    },
    {
      name: 'Phases',
      component: <PhaseSettings collection={collection} closeModal={onClose} />,
    },
    { name: 'People', component: <div></div> },
    { name: 'Topics', component: <div></div> },
    { name: 'Styles', component: <div></div> },
  ]
}

const ChallengeSettingsModal = ({ collection, open, onClose }) => {
  const [challenge, setChallenge] = useState(null)

  useEffect(() => {
    // If the collection passed in is parent challenge, use that
    if (collection.challenge_id === collection.id) {
      setChallenge(collection)
    } else {
      const fetchChallenge = async () => {
        // Otherwise we need to load the challenge colleciton
        const res = await collection.apiStore.request(
          `collections/${collection.challenge_id}`
        )
        if (res.data) setChallenge(res.data)
      }
      fetchChallenge()
    }
  })

  if (!challenge) return ''

  return (
    <ModalWithNavigation
      title="Challenge settings"
      contents={modalContents({ collection: challenge, onClose })}
      open={open}
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
