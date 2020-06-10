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

const PhaseSettings = ({ collection, closeModal }) => {
  const [submissionBoxes, setSubmissionBoxes] = useState([])
  const [viewingSubmissionBoxId, setViewingSubmissionBoxId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingPhaseCollectionId, setEditingPhaseCollectionId] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      const subBoxes = await collection.loadSubmissionBoxesAndPhases()
      if (subBoxes.length > 0) {
        setViewingSubmissionBoxId(subBoxes[0].id)
      }
      // Spread arrays/object so useState knows to update it
      setSubmissionBoxes([...subBoxes])
      setIsLoading(false)
    }
    loadData()
  }, [collection])

  const createPhaseCollection = async submissionBox => {
    const phaseCollection = await submissionBox.createChildPhaseCollection(
      `Phase ${submissionBox.phaseCollections.length}`
    )
    submissionBox.setPhaseCollections([
      ...submissionBox.phaseCollections,
      phaseCollection,
    ])
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
            {submissionBox.phaseCollections.map(phase => {
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
              onClick={() => createPhaseCollection(submissionBox)}
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
