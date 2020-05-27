import PropTypes from 'prop-types'

import { apiStore } from '~/stores'
import { submissionTypeForName } from '~/ui/submission_box/SubmissionBoxSettings'
import {
  SubmissionBoxRowForItem,
  SubmissionBoxRowForTemplate,
} from '~/ui/submission_box/SubmissionBoxRow'

const SubmissionBoxFormat = props => {
  const {
    submissionTemplateId,
    submissionBoxTypeName,
    onChooseTemplate,
    onChooseNonTemplateType,
  } = props
  let template
  let row
  if (submissionTemplateId) {
    template = apiStore.find('collections', submissionTemplateId)
  }
  if (template) {
    row = (
      <SubmissionBoxRowForTemplate
        template={template}
        onChooseTemplate={onChooseTemplate}
      />
    )
  } else if (submissionBoxTypeName && submissionBoxTypeName !== 'template') {
    const type = submissionTypeForName(submissionBoxTypeName)
    row = (
      <SubmissionBoxRowForItem
        type={type}
        onChooseType={onChooseNonTemplateType}
      />
    )
  }

  return (
    <React.Fragment>
      {row}
      <div onClick={/* open EditSubmissionBoxFormatModal */}>
        [edit]
      </div>
    </React.Fragment>
  )
}

SubmissionBoxFormat.propTypes = {
  submissionTemplateId: PropTypes.number,
  submissionBoxTypeName: PropTypes.string,
  onChooseTemplate: PropTypes.func,
  onChooseNonTemplateType: PropTypes.func,
}

SubmissionBoxFormat.defaultProps = {
  submissionTemplateId: null,
  submissionBoxTypeName: null,
  onChooseTemplate: () => null,
  onChooseNonTemplateType: () => null,
}

export default SubmissionBoxFormat
