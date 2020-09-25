import PropTypes from 'prop-types'
import { Box } from 'reflexbox'

import BctButton from '~/ui/global/BctButton'
import Tooltip from '~/ui/global/Tooltip'

const BctButtonBox = ({ type, tooltip, size, creating, onClick, Icon }) => (
  <Box className="BctButtonBox">
    <Tooltip
      classes={{ tooltip: 'Tooltip' }}
      title={tooltip}
      placement="bottom"
    >
      <BctButton
        data-cy={`BctButton-${type}`}
        creating={creating === type}
        onClick={onClick}
      >
        <Icon width={size} height={size} color="white" />
      </BctButton>
    </Tooltip>
  </Box>
)

BctButtonBox.propTypes = {
  type: PropTypes.string,
  tooltip: PropTypes.string,
  size: PropTypes.number.isRequired,
  creating: PropTypes.string,
  onClick: PropTypes.func,
  Icon: PropTypes.func.isRequired,
}
BctButtonBox.defaultProps = {
  onClick: () => null,
  tooltip: '',
  creating: '',
  type: '',
}

export default BctButtonBox
