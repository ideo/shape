import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Modal from '~/ui/global/modals/Modal'

const FeedbackTermsModal = ({ children, close }) => (
  <Modal title="Feedback Terms and Conditions" open onClose={close}>
    {children}
  </Modal>
)

FeedbackTermsModal.propTypes = {
  children: PropTypes.node.isRequired,
  close: PropTypes.func.isRequired,
}

export default FeedbackTermsModal
