import PropTypes from 'prop-types'

const Emoji = props => (
  <tspan
    className="emoji"
    role="img"
    aria-label={props.name ? props.name : ''}
    aria-hidden={props.name ? 'false' : 'true'}
    style={{ fontSize: `${parseInt(32 * props.scale)}px` }}
  >
    {props.symbol}
  </tspan>
)

Emoji.propTypes = {
  name: PropTypes.string,
  symbol: PropTypes.string,
  scale: PropTypes.number,
}
Emoji.defaultProps = {
  name: null,
  symbol: null,
  scale: 1,
}

export default Emoji
