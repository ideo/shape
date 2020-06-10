import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import { apiStore } from '~/stores'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import InlineLoader from '~/ui/layout/InlineLoader'
import Panel from '~/ui/global/Panel'
import TextButton from '~/ui/global/TextButton'
import {
  PhaseCollectionRow,
  EditPhaseCollectionRow,
} from '~/ui/challenges/PhaseCollectionRow'
import v from '~/utils/variables'

const Phases = styled.div`
  margin-bottom: 1rem;
`

// TODO: probably should move this to Collection.js
const handleCreatePhaseCollection = async ({ parent, numPhases, onCreate }) => {
  const attrs = {
    collection_attributes: {
      name: `Phase ${numPhases + 1}`,
      collection_type: 'phase',
    },
    parent_id: parent.id,
  }
  const card = new CollectionCard(attrs, apiStore)
  card.parent = parent
  // TODO: add error handling
  const savedCard = await card.API_create()
  onCreate(savedCard.record)
}

const loadPhaseCollections = async (collection, callback) => {
  const request = await collection.API_fetchChallengePhaseCollections()
  return request.data
}

// TODO: should this be here or in Collection.js?
const loadSubmissionBoxesAndPhases = async collection => {
  const phases = {}
  const request = await collection.API_fetchChallengeSubmissionBoxCollections()
  const submissionBoxes = request.data
  if (submissionBoxes.length > 0) {
    // TODO: should these just be loaded and stored by Collection itself?
    // Get phase collections for each submission box
    const loadPhases = submissionBoxes.map(subBox => {
      return new Promise(resolve => {
        resolve(loadPhaseCollections(subBox))
      }).then(
        subBoxPhases => (phases[`collection-${subBox.id}`] = subBoxPhases)
      )
    })
    await Promise.all(loadPhases)
  }
  return {
    submissionBoxes,
    phases,
  }
}

const PhaseSettings = ({ collection, closeModal }) => {
  const [submissionBoxes, setSubmissionBoxes] = useState([])
  const [phases, setPhases] = useState({})
  const [viewingSubmissionBoxId, setViewingSubmissionBoxId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingPhaseCollectionId, setEditingPhaseCollectionId] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      const data = await loadSubmissionBoxesAndPhases(collection)
      if (data.submissionBoxes.length > 0) {
        setViewingSubmissionBoxId(data.submissionBoxes[0].id)
      }
      // Spread arrays/object so useState knows to update it
      setSubmissionBoxes([...data.submissionBoxes])
      setPhases({ ...data.phases })
      setIsLoading(false)
    }
    loadData()
  }, [collection])

  const phasesForSubmissionBoxId = submissionBoxId => {
    const subBoxPhases = phases[`collection-${submissionBoxId}`]
    console.log('got phases', subBoxPhases)
    return subBoxPhases ? subBoxPhases : []
  }

  const onCreatePhaseCollection = (submissionBox, phaseCollection) => {
    const phasesForSubBox = phasesForSubmissionBoxId(submissionBox.id)
    setPhases({
      ...phases,
      [`collection-${submissionBox.id}`]: [...phasesForSubBox, phaseCollection],
    })
    setEditingPhaseCollectionId(phaseCollection.id)
  }

  return (
    <div>
      {isLoading && <InlineLoader />}
      {submissionBoxes.map(submissionBox => (
        <Panel
          key={submissionBox.id}
          title={submissionBox.name}
          open={viewingSubmissionBoxId === submissionBox.id}
        >
          <Phases>
            {phasesForSubmissionBoxId(submissionBox.id).map(phase => {
              return editingPhaseCollectionId === phase.id ? (
                <EditPhaseCollectionRow
                  collection={phase}
                  onDone={() => setEditingPhaseCollectionId(null)}
                />
              ) : (
                <PhaseCollectionRow collection={phase} />
              )
            })}
            <TextButton
              color={v.colors.black}
              fontSizeEm={0.75}
              onClick={() =>
                handleCreatePhaseCollection({
                  parent: submissionBox,
                  numPhases: phasesForSubmissionBoxId(submissionBox.id).length,
                  onCreate: phaseCollection =>
                    onCreatePhaseCollection(submissionBox, phaseCollection),
                })
              }
            >
              + Add Phase
            </TextButton>
          </Phases>
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
