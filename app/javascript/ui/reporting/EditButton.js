import PropTypes from 'prop-types'
import styled from 'styled-components'

import EditPencilIcon from '~/ui/icons/EditPencilIcon'

const IconHolder = styled.span`
  display: inline-block;
  height: 16px;
  vertical-align: middle;
  margin-top: 5px;
  width: 16px;
`

class EditButton extends React.Component {
  render() {
    return (
      <IconHolder onClick={this.props.onClick} className="show-on-hover">
        <EditPencilIcon />
      </IconHolder>
    )
  }
}

EditButton.propTypes = {
  onClick: PropTypes.func.isRequired,
}

export default EditButton
