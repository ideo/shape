import PropTypes from 'prop-types'

const Emoji = props => (
  <span
    className="emoji"
    role="img"
    aria-label={props.name ? props.name : ''}
    aria-hidden={props.name ? 'false' : 'true'}
    style={{ fontSize: '32px' }}
  >
    {props.symbol}
  </span>
)

Emoji.propTypes = {
  name: PropTypes.string,
  symbol: PropTypes.string,
}
Emoji.defaultProps = {
  name: null,
  symbol: null,
}

export default Emoji
