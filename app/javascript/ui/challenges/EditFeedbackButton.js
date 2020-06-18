import PropTypes from 'prop-types'
import Tooltip from '~/ui/global/Tooltip'
import EditPencilIcon from '~/ui/icons/EditPencilIcon'
import IconHolder from '~/ui/icons/IconHolder'
import v from '~/utils/variables'

const EditFeedbackButton = ({ onClick }) => {
  return (
    <button onClick={onClick}>
      <Tooltip
        classes={{ tooltip: 'Tooltip' }}
        title="Edit Feedback"
        placement="top"
      >
        <IconHolder
          height={24}
          width={24}
          marginTop={-16}
          marginRight={42}
          color={v.colors.black}
        >
          <EditPencilIcon />
        </IconHolder>
      </Tooltip>
    </button>
  )
}

EditFeedbackButton.propTypes = {
  onClick: PropTypes.func.isRequired,
}

export default EditFeedbackButton
