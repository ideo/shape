import { PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'

import { apiStore } from '~/stores'
import { SubmissionBoxRowForTemplate } from '~/ui/submission_box/SubmissionBoxRow'

const showSubmissionBoxFormatModal = () => {
  console.log('open the modal')
}

const SubmissionBoxFormat = ({ collection }) => {
  const { submission_template_id } = collection
  let template
  if (submission_template_id) {
    template = apiStore.find('collections', submission_template_id)
  }
  return (
    <Flex column justify="flex-start">
      <div onClick={showSubmissionBoxFormatModal}>
        {template && (
          <SubmissionBoxRowForTemplate template={template} canEdit={true} />
        )}
      </div>
    </Flex>
  )
}

SubmissionBoxFormat.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default SubmissionBoxFormat
