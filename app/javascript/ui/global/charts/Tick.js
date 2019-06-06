import PropTypes from 'prop-types'
import { VictoryLabel } from 'victory'

import TickWrapper from '~/ui/global/charts/TickWrapper'
import v from '~/utils/variables'

const Tick = props => {
  const emoji = props.emojiScale[props.index]
  if (!emoji) return <div />
  const { scale, name } = emoji
  const fontSize = parseInt((scale || 1) * 24)
  return (
    <TickWrapper title={name}>
      <VictoryLabel
        {...props}
        style={{ fill: v.colors.tertiaryMedium, fontSize }}
      />
    </TickWrapper>
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
