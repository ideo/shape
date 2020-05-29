import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'
import styled from 'styled-components'

import { apiStore } from '~/stores'
import {
  SubmissionBoxRowForTemplate,
  SubmissionBoxRowForItem,
} from '~/ui/submission_box/SubmissionBoxRow'
import EditSubmissionBoxFormat from '~/ui/submission_box/EditSubmissionBoxFormat'
import { submissionTypeForName } from '~/ui/submission_box/SubmissionBoxSettings'
import EditPencilIcon from '~/ui/icons/EditPencilIcon'
import Tooltip from '~/ui/global/Tooltip'

const IconRight = styled.div`
  align-self: end;
  width: 24px;
  margin: 0.5rem;
  cursor: pointer;
`

const EditActions = ({ onEdit, onSwitch }) => {
  return (
    <React.Fragment>
      {onEdit && (
        <IconRight onClick={onEdit}>
          <Tooltip
            classes={{ tooltip: 'Tooltip' }}
            title="Edit submission template"
          >
            <EditPencilIcon />
          </Tooltip>
        </IconRight>
      )}
      <IconRight onClick={onSwitch}>
        <Tooltip classes={{ tooltip: 'Tooltip' }} title="Switch format">
          <EditPencilIcon />
        </Tooltip>
      </IconRight>
    </React.Fragment>
  )
}

EditActions.propTypes = {
  onSwitch: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
}

EditActions.defaultProps = {
  onEdit: () => null,
}

const SubmissionBoxFormat = ({ collection }) => {
  const [showEditFormat, setShowEditFormat] = useState(true)
  const {
    submissionFormat,
    submission_template_id,
    submission_box_type,
  } = collection
  let template
  let submissionType
  if (submissionFormat === 'template') {
    template = apiStore.find('collections', submission_template_id)
  }
  if (template || submissionFormat === 'item') {
    // They have chosen a format
    submissionType = submissionTypeForName(submission_box_type)
    useEffect(() => {
      setShowEditFormat(false)
    }, [submission_template_id, submissionFormat])
  }
  if (showEditFormat) {
    return <EditSubmissionBoxFormat collection={collection} />
  } else {
    return (
      <Flex column justify="flex-start">
        {submissionFormat === 'template' && (
          <SubmissionBoxRowForTemplate
            template={template}
            rightSideComponent={
              <EditActions
                onEdit={() => console.log('go to template')}
                onSwitch={() => setShowEditFormat(true)}
              />
            }
          />
        )}
        {submissionFormat === 'item' && (
          <SubmissionBoxRowForItem
            type={submissionType}
            rightSideComponent={
              <EditActions onSwitch={() => setShowEditFormat(true)} />
            }
          />
        )}
      </Flex>
    )
  }
}

SubmissionBoxFormat.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default SubmissionBoxFormat
