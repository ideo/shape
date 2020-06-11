import Button from '~/ui/global/Button'
import PropTypes from 'prop-types'
import v from '~/utils/variables'

const TopRightChallengeButton = ({ name, color, onClick, hidden }) => {
  if (hidden) return null

  return (
    <Button
      style={{ marginLeft: '1rem' }}
      colorScheme={color}
      size="sm"
      width={256}
      onClick={onClick}
    >
      {name}
    </Button>
  )
}

TopRightChallengeButton.propTypes = {
  name: PropTypes.string.isRequired,
  color: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  hidden: PropTypes.bool,
}

TopRightChallengeButton.defaultProps = {
  color: v.colors.primaryDarkest,
  hidden: false,
}

export default TopRightChallengeButton
