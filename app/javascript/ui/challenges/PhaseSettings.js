import { useState, useEffect, Fragment } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import _ from 'lodash'

import InlineLoader from '~/ui/layout/InlineLoader'
import Panel from '~/ui/global/Panel'
import TextButton from '~/ui/global/TextButton'
import PhaseCollectionRow, {
  PhaseCollectionWithoutTemplateRow,
  ChallengeWithoutSubmissionBoxMessage,
} from '~/ui/challenges/PhaseCollectionRow'
import v from '~/utils/variables'

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
      const subBoxesWithPhases = await collection.loadPhasesForSubmissionBoxes(
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

  const renderPhaseRowsForTemplate = submissionBox => {
    const { phaseSubCollections } = submissionBox

    return (
      <Fragment>
        {phaseSubCollections.map(phase => (
          <PhaseCollectionRow
            collection={phase}
            showEdit={editingPhaseCollectionId === phase.id}
            onDoneEditing={() => setEditingPhaseCollectionId(null)}
            closeModal={closeModal}
            key={phase.id}
          />
        ))}
        <TextButton
          color={v.colors.black}
          fontSizeEm={0.75}
          onClick={() => createSubmissionTemplatePhaseCollection(submissionBox)}
        >
          + Add Phase
        </TextButton>
      </Fragment>
    )

    return null
  }

  const renderPhaseRows = submissionBox => {
    const { submissionFormat, submission_box_type } = submissionBox

    if (submissionFormat === 'item') {
      const message = `Phases can not be added to a ${submission_box_type} item. Change this submission box to
      use a submission template in the 'Submission Settings' tab above if you
      want to add phases.`
      return <PhaseCollectionWithoutTemplateRow message={message} />
    } else if (submissionFormat === 'template') {
      return renderPhaseRowsForTemplate(submissionBox)
    }

    return null
  }

  return (
    <div>
      {isLoading && <InlineLoader />}
      {_.isEmpty(submissionBoxesWithPhases) && (
        <ChallengeWithoutSubmissionBoxMessage />
      )}
      {submissionBoxesWithPhases.map(submissionBox => (
        <Panel
          key={submissionBox.id}
          title={submissionBox.name}
          open={viewingSubmissionBoxId === submissionBox.id}
        >
          <Phases>{renderPhaseRows(submissionBox)}</Phases>
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
