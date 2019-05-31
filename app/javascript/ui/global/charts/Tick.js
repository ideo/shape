import PropTypes from 'prop-types'
import { VictoryLabel } from 'victory'

import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'

const Tick = props => {
  const emoji = props.emojiScale[props.index]
  if (!emoji) return <div />
  const fontSize = parseInt((emoji.scale || 1) * 24)
  return (
    <Tooltip
      classes={{ tooltip: 'Tooltip' }}
      title={emoji.name}
      placement="top"
      open={props.isHovered}
    >
      <VictoryLabel
        {...props}
        style={{ fill: v.colors.tertiaryMedium, fontSize }}
      />
    </Tooltip>
  )
}

Tick.propTypes = {
  emojiScale: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      symbol: PropTypes.string,
      scale: PropTypes.number,
    })
  ).isRequired,
}

export default Tick
