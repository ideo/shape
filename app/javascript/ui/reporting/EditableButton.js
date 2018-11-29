import styled from 'styled-components'
import v from '~/utils/variables'
import PropTypes from 'prop-types'

const StyledButton = styled.button`
  ${props =>
    props.editable &&
    `
      &:hover {
        background-color: ${v.colors.primaryLight};
      }
`};
`

const EditableButton = ({ onClick, children }) => (
  <StyledButton onClick={onClick} className="editable">
    {children}
  </StyledButton>
)

EditableButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
}

export default EditableButton
