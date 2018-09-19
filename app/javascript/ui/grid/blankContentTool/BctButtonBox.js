import PropTypes from 'prop-types'
import { Box } from 'reflexbox'

import Tooltip from '~/ui/global/Tooltip'
import { BctButton } from '~/ui/grid/shared'

const BctButtonBox = ({ type, tooltip, size, creating, onClick, Icon }) => (
  <Box>
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
