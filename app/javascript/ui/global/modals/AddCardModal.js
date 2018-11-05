import PropTypes from 'prop-types'
import Modal from '~/ui/global/modals/Modal'

const AddCardModal = ({ children, close }) => (
  <Modal title="Add payment method" open onClose={close}>
    {children}
  </Modal>
)

AddCardModal.propTypes = {
  children: PropTypes.node.isRequired,
  close: PropTypes.func.isRequired,
}

export default AddCardModal
