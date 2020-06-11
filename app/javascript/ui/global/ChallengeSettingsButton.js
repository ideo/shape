import Button from '~/ui/global/Button'
import PropTypes from 'prop-types'
import v from '~/utils/variables'

const ChallengeSettingsButton = ({ handleShowSettings }) => {
  return (
    <Button
      style={{ marginLeft: '1rem' }}
      colorScheme={v.colors.primaryDarkest}
      size="sm"
      width={256}
      onClick={handleShowSettings}
    >
      Challenge Settings
    </Button>
  )
}

ChallengeSettingsButton.propTypes = {
  handleShowSettings: PropTypes.func.isRequired,
}

export default ChallengeSettingsButton
