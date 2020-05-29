import Button from '~/ui/global/Button'
import PropTypes from 'prop-types'
import v from '~/utils/variables'

const ChallengeSettingsButton = ({ onSettingsClick }) => {
  return (
    <Button
      style={{ marginLeft: '1rem' }}
      colorScheme={v.colors.primaryDarkest}
      size="sm"
      width={256}
      onClick={onSettingsClick}
    >
      Challenge Settings
    </Button>
  )
}

ChallengeSettingsButton.propTypes = {
  onSettingsClick: PropTypes.func.isRequired,
}

export default ChallengeSettingsButton
