import PropTypes from 'prop-types'

import CardActionHolder from '~/ui/icons/CardActionHolder'
import EditPencilIcon from '~/ui/icons/EditPencilIcon'

class EditButton extends React.Component {
  render() {
    return (
      <CardActionHolder
        className="show-on-hover"
        onClick={this.props.onClick}
        size={26}
        tooltipText="Edit"
      >
        <EditPencilIcon />
      </CardActionHolder>
    )
  }
}

EditButton.propTypes = {
  onClick: PropTypes.func.isRequired,
}

export default EditButton
