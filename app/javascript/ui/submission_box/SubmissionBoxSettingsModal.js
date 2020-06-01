import styled from 'styled-components'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import { uiStore, routingStore, apiStore } from '~/stores'
import { Heading2 } from '~/ui/global/styled/typography'
import Modal from '~/ui/global/modals/Modal'
import v from '~/utils/variables'
import SubmissionBoxSettings from '~/ui/submission_box/SubmissionBoxSettings'

const StyledTitleContent = styled.div`
  border-bottom: 1px solid ${v.colors.commonMedium};
`

const closeSubmissionBoxSettings = collection => {
  if (collection.submissionFormat) {
    uiStore.update('submissionBoxSettingsOpen', false)
    uiStore.closeDialog()
    return
  }
  // Note that the meaning of "cancel" and "confirm" are sort of reversed in this context.
  // "cancel" means cancel creating the SubmissionBox, which will delete it and go back.
  // "confirm" means do nothing so that you can continue with setup.
  uiStore.confirm({
    iconName: 'Alert',
    prompt: `Closing the submission settings without choosing a submission format
             will delete this submission box.`,
    confirmText: 'Choose',
    cancelText: 'Delete',
    onCancel: async () => {
      await apiStore.request(`collections/${collection.id}`, 'DELETE')
      if (collection.parent_collection_card.parent_id) {
        routingStore.routeTo(
          'collections',
          collection.parent_collection_card.parent_id
        )
      } else {
        routingStore.routeTo('homepage')
      }
    },
    onConfirm: () => uiStore.closeDialog(),
  })
}

const SubmissionBoxSettingsModal = ({ collection }) => {
  return (
    <Modal
      title={
        <StyledTitleContent>
          <Heading2>Submission Box Settings</Heading2>
        </StyledTitleContent>
      }
      onClose={() => closeSubmissionBoxSettings(collection)}
      open
    >
      <SubmissionBoxSettings
        collection={collection}
        closeModal={() => closeSubmissionBoxSettings(collection)}
      />
    </Modal>
  )
}

SubmissionBoxSettingsModal.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}
export default SubmissionBoxSettingsModal
