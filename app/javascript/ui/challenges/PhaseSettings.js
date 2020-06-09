import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { inject, PropTypes as MobxPropTypes } from 'mobx-react'

import CollectionCard from '~/stores/jsonApi/CollectionCard'
import InlineLoader from '~/ui/layout/InlineLoader'
import Panel from '~/ui/global/Panel'
import TextButton from '~/ui/global/TextButton'

const EditPhaseCollection = ({ collection }) => {
  return <div>{collection.name}</div>
}
EditPhaseCollection.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

const handleCreatePhase = inject('apiStore')(
  async ({ apiStore, parent, phasesBySubBoxId, setPhasesBySubBoxId }) => {
    const attrs = {
      collection_attributes: {
        collection_type: 'phase',
      },
      parent_id: parent.id,
    }
    const phaseCollectionCard = new CollectionCard(attrs, apiStore)
    phaseCollectionCard.parent = parent
    await phaseCollectionCard.API_create()
    setPhasesBySubBoxId({
      ...phasesBySubBoxId,
      [parent.id]: [...phasesBySubBoxId[parent.id], phaseCollectionCard.record],
    })
  }
)

const PhaseSettings = ({ collection, closeModal }) => {
  const [phasesBySubBoxId, setPhasesBySubBoxId] = useState({})
  const [submissionBoxes, setSubmissionBoxes] = useState([])
  const [viewingSubmissionBoxId, setViewingSubmissionBoxId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSubmissionBoxesAndPhases = async () => {
      const request = await collection.API_fetchChallengeSubmissionBoxCollections()
      const subBoxes = request.data
      if (subBoxes.length > 0) {
        // Get phase collections for each submission box
        subBoxes.forEach(async subBox => {
          const request = await subBox.API_fetchChallengePhaseCollections()
          // Set full object so useState knows to update it
          setPhasesBySubBoxId({
            ...phasesBySubBoxId,
            [subBox.id]: request.data,
          })
        })
        setViewingSubmissionBoxId(subBoxes[0].id)
      }
      setSubmissionBoxes(subBoxes)
      setIsLoading(false)
    }
    fetchSubmissionBoxesAndPhases()
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
          {phasesBySubBoxId[submissionBox.id] &&
            phasesBySubBoxId[submissionBox.id].map(phase => (
              <EditPhaseCollection collection={phase} />
            ))}
          <TextButton
            onClick={() =>
              handleCreatePhase({
                parent: submissionBox,
                phasesBySubBoxId,
                setPhasesBySubBoxId,
              })
            }
          >
            + Add Phase
          </TextButton>
        </Panel>
      ))}
    </div>
  )
}

PhaseSettings.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  closeModal: PropTypes.func.isRequired,
}

export default PhaseSettings
