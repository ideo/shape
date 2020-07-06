import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import InlineLoader from '~/ui/layout/InlineLoader'
import Panel from '~/ui/global/Panel'
import TextButton from '~/ui/global/TextButton'
import PhaseCollectionRow, {
  PhaseCollectionWithoutTemplateRow,
} from '~/ui/challenges/PhaseCollectionRow'
import v from '~/utils/variables'
import Collection from '~/stores/jsonApi/Collection'

const Phases = styled.div`
  margin-bottom: 1rem;
`

const PhaseSettings = ({ collection, submissionBoxes, closeModal }) => {
  const [submissionBoxesWithPhases, setSubmissionBoxesWithPhases] = useState([])
  const [viewingSubmissionBoxId, setViewingSubmissionBoxId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingPhaseCollectionId, setEditingPhaseCollectionId] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      const subBoxesWithPhases = await Collection.loadPhasesForSubmissionBoxes(
        submissionBoxes
      )
      if (subBoxesWithPhases.length === 1) {
        setViewingSubmissionBoxId(subBoxesWithPhases[0].id)
      }
      setSubmissionBoxesWithPhases(subBoxesWithPhases)
      setIsLoading(false)
    }
    loadData()
  }, [collection])

  const createSubmissionTemplatePhaseCollection = async submissionBox => {
    // Create phase collection in the submission template
    const submissionBoxTemplate = submissionBox.submission_template
    const phaseCollection = await submissionBoxTemplate.createChildPhaseCollection(
      `Phase ${submissionBox.phaseSubCollections.length + 1}`
    )
    // Update our UI with the new phase collection
    submissionBox.setPhaseSubCollections([
      ...submissionBox.phaseSubCollections,
      phaseCollection,
    ])
    setEditingPhaseCollectionId(phaseCollection.id)
  }

  return (
    <div>
      {isLoading && <InlineLoader />}
      {submissionBoxesWithPhases.map(submissionBox => (
        <Panel
          key={submissionBox.id}
          title={submissionBox.name}
          open={viewingSubmissionBoxId === submissionBox.id}
        >
          <Phases>
            {submissionBox.submissionFormat === 'item' && (
              <PhaseCollectionWithoutTemplateRow
                formatType={`${submissionBox.submission_box_type} item`}
              />
            )}
            {submissionBox.submissionFormat === 'template' &&
              submissionBox.phaseSubCollections.map(phase => (
                <PhaseCollectionRow
                  collection={phase}
                  showEdit={editingPhaseCollectionId === phase.id}
                  onDoneEditing={() => setEditingPhaseCollectionId(null)}
                  closeModal={closeModal}
                  key={phase.id}
                />
              ))}
            {submissionBox.submissionFormat === 'template' && (
              <TextButton
                color={v.colors.black}
                fontSizeEm={0.75}
                onClick={() =>
                  createSubmissionTemplatePhaseCollection(submissionBox)
                }
              >
                + Add Phase
              </TextButton>
            )}
          </Phases>
        </Panel>
      ))}
    </div>
  )
}

PhaseSettings.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  submissionBoxes: MobxPropTypes.arrayOrObservableArray.isRequired,
  closeModal: PropTypes.func.isRequired,
}

export default PhaseSettings
