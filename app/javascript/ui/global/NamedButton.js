import Button from '~/ui/global/Button'
import PropTypes from 'prop-types'
import v from '~/utils/variables'

const NamedButton = ({ name, color, onClick, disabled }) => {
  return (
    <Button
      style={{ marginLeft: '1rem' }}
      colorScheme={color}
      size="sm"
      width={256}
      onClick={onClick}
      disabled={disabled}
    >
      {name}
    </Button>
  )
}

NamedButton.propTypes = {
  name: PropTypes.string.isRequired,
  color: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
}

NamedButton.defaultProps = {
  color: v.colors.primaryDarkest,
  disabled: false,
}

export default NamedButton
