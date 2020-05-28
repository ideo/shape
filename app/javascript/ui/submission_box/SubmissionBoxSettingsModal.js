import styled from 'styled-components'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import { uiStore } from '~/stores'
import { Heading2 } from '~/ui/global/styled/typography'
import Modal from '~/ui/global/modals/Modal'
import v from '~/utils/variables'
import SubmissionBoxSettings from '~/ui/submission_box/SubmissionBoxSettings'

const StyledTitleContent = styled.div`
  border-bottom: 1px solid ${v.colors.commonMedium};
`

const closeSubmissionBoxSettings = () => {
  // TODO: not sure we need to do both
  uiStore.update('submissionBoxSettingsOpen', false)
  uiStore.closeDialog()
}

const SubmissionBoxSettingsModal = props => {
  const { collection } = props
  return (
    <Modal
      title={
        <StyledTitleContent>
          <Heading2>Submission Box Settings</Heading2>
        </StyledTitleContent>
      }
      onClose={closeSubmissionBoxSettings}
      open
    >
      <SubmissionBoxSettings collection={collection} />
    </Modal>
  )
}

SubmissionBoxSettingsModal.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}
export default SubmissionBoxSettingsModal
